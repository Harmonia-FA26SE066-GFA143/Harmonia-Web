import { useCallback, useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '@/shared/ui/useReducedMotion'
import { ACTIVE_NOTE_CLASS } from './useScoreSync'

/** The viewer's one scroll region (ScoreViewer.css). */
const SCROLL_REGION = '.hm-score-scroll'
/** A sounding note must stay this far (share of the region's height) from both edges, or the region scrolls. */
const EDGE = 0.1
/** After a jump the system of the note starts this far (share of the region's height) below the top edge. */
const TOP_GAP = 0.15
/**
 * How long (ms) a scroll the code asked for is believed to be still under way when the browser does not say it ended
 * (no `scrollend`) and the position has not reached the target. A smooth scroll of one screen (about 540 px) was seen to
 * take about 0.6 s in Chromium; one second leaves room for a slow frame without letting a later hand scroll pass as the code's.
 */
const CODE_SCROLL_MAX_MS = 1000
/**
 * The position is within this many px of the target: the scroll has arrived. Its last scroll events still come (a smooth
 * scroll creeps the final pixel over a few frames, one event each; 325 → 326 was seen), so arrival does not end the code
 * scroll at once: the events of the next `ARRIVED_SETTLE_MS` are still the code's.
 */
const ARRIVED_PX = 0.5
const ARRIVED_SETTLE_MS = 100
/**
 * While a code scroll is under way the position only gets closer to its target. It may step back this many px (the browser
 * rounds a smooth scroll to device pixels) before that counts as the hand pulling the other way.
 */
const BACKWARD_PX = 2
/**
 * Keys that scroll a focused region. Space and Home are playback shortcuts (play/pause, to the start) and ←/→ seek: they
 * do not scroll. Shift+Space (the browser's scroll up) is handled apart, since the shortcuts leave a key with a modifier.
 */
const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'End'])
/** Where a key means something else than scrolling: typing, pressing, a slider. */
const OWN_KEYS = 'input, textarea, select, button, a[href], [role="slider"], [contenteditable]:not([contenteditable="false"])'

/** The claim of the code to the scroll events it causes (a lease). One lease covers a chain of overlapping `scrollTo` calls. */
interface CodeScroll {
  /** `scrollTop` the latest call asked for. */
  target: number
  /** Distance to `target` at the latest scroll event (at the call, before any). It only shrinks, bar `BACKWARD_PX`. */
  distance: number
  /** `performance.now()` of the chain's first call + `CODE_SCROLL_MAX_MS`. Later calls never move it. */
  cap: number
  /** `performance.now()` after which the scroll is no longer believed to be under way (`cap`, or sooner once it arrived). */
  deadline: number
  /** Press order at the chain's first call: a pointer pressed after it was pressed while the code was scrolling. */
  since: number
}

/** Brings the sounding note back into view by jumping to the top of its system (a page of the sheet at a time). */
function scrollToSoundingNote(root: HTMLElement, instant: boolean, onCodeScroll: (target: number, from: number) => void) {
  const region = root.querySelector<HTMLElement>(SCROLL_REGION)
  const note = root.querySelector(`.${ACTIVE_NOTE_CLASS}`)
  if (!region || !note) return
  const box = region.getBoundingClientRect()
  const spot = note.getBoundingClientRect()
  if (spot.top >= box.top + box.height * EDGE && spot.bottom <= box.bottom - box.height * EDGE) return
  const system = note.closest('g.system')
  const systemBox = system?.getBoundingClientRect()
  // A system taller than the region cannot be shown whole: anchor on the note itself then.
  const anchor = systemBox && systemBox.height <= box.height * (1 - TOP_GAP - EDGE) ? systemBox : spot
  const wanted = region.scrollTop + anchor.top - box.top - box.height * TOP_GAP
  // Clamped to what the region can scroll: the first and last systems sit inside the edge margin and cannot get out of
  // it, which must not mean a scroll call at every note.
  const top = Math.min(Math.max(0, wanted), Math.max(0, region.scrollHeight - region.clientHeight))
  if (Math.abs(top - region.scrollTop) < 1) return
  onCodeScroll(top, region.scrollTop) // before the call: the scroll events it causes must already be known as the code's
  region.scrollTo({ top, behavior: instant ? 'instant' : 'smooth' })
}

/**
 * Keeps the sounding note in view inside the viewer's scroll region, without a timer or a frame loop: the sync hook
 * toggles a class when the sounding notes change, and only that (a few times a second) is observed. The page owns the
 * region's height.
 *
 * Which scrolls end following (until `resume`). A scroll the user starts shows as an intent before it happens: a wheel
 * that moves something (not a ctrl+wheel pinch), touch moves, scroll keys (not where a control uses them), the middle
 * button (autoscroll). A scroll with no intent in front of it (an overlay scroll bar dragged, text selected to the edge)
 * shows as a `scroll` event while a pointer is held that was pressed in the region. What each event is, and what it does:
 *
 * | event                                                         | it is             | it does                                         |
 * | ------------------------------------------------------------- | ----------------- | ----------------------------------------------- |
 * | wheel with a delta (no ctrl), touchmove, scroll key, middle   | the user's        | stop (the lease is dropped)                     |
 * | pointerdown in the region                                     | evidence          | the pointer is held, with its press order       |
 * | pointerup / cancel / lost capture of that pointer             | end of evidence   | that pointer is let go                          |
 * | window blur                                                   | end of evidence   | every pointer is let go                         |
 * | scrollTo by the code                                          | opens a lease     | a lease already open: new target, same cap      |
 * | scroll, lease open, a pointer pressed after its first call    | the user's        | stop: the user wins over the lease              |
 * | scroll, lease open, farther from the target (> 2 px)          | the user's        | stop: it went the other way                     |
 * | scroll, lease open, the height changed                        | layout            | follow the new height, the lease goes on        |
 * | scroll, lease open, otherwise                                 | the code's        | arrival (< 0.5 px) shortens the lease to 100 ms |
 * | scrollend, lease open                                         | end of the code's | drop the lease; stop if a pointer was pressed after its first call |
 * | scroll, no lease (ended, past the cap, or stopped), height changed, position at the new maximum | a clamp | nothing              |
 * | scroll, no lease, otherwise, a pointer held                   | the user's        | stop                                            |
 * | scroll, no lease, otherwise, no pointer held                  | unexplained       | nothing                                         |
 *
 * A lease ends at the first of `scrollend`, `ARRIVED_SETTLE_MS` after arrival, `CODE_SCROLL_MAX_MS` after the chain's first
 * call, or a stop. Neither the code's scrolls, a relayout nor a pointer pressed before the code scrolled can end following.
 */
export function useFollowScroll(viewerRoot: HTMLElement | null) {
  const [following, setFollowing] = useState(true)
  const followingRef = useRef(true)
  const codeScrollRef = useRef<CodeScroll | null>(null)
  /** Press order of the pointers held in the region, by `pointerId`; `pressOrderRef` counts presses and lease openings. */
  const heldRef = useRef(new Map<number, number>())
  const pressOrderRef = useRef(0)
  const reduced = useReducedMotion()
  const reducedRef = useRef(reduced)
  useEffect(() => {
    reducedRef.current = reduced
  }, [reduced])

  const markCodeScroll = useCallback((target: number, from: number) => {
    const now = performance.now()
    const lease = codeScrollRef.current
    const distance = Math.abs(target - from)
    if (lease && now <= lease.deadline) {
      // A call inside a chain: the cap does not move, or overlapping calls could keep the claim open for ever.
      Object.assign(lease, { target, distance, deadline: lease.cap })
      return
    }
    const cap = now + CODE_SCROLL_MAX_MS
    pressOrderRef.current += 1
    codeScrollRef.current = { target, distance, cap, deadline: cap, since: pressOrderRef.current }
  }, [])

  useEffect(() => {
    if (!viewerRoot) return
    const region = () => viewerRoot.querySelector<HTMLElement>(SCROLL_REGION)
    const held = heldRef.current
    const pressedSince = (order: number) => [...held.values()].some((pressed) => pressed > order)
    const stop = () => {
      codeScrollRef.current = null
      if (!followingRef.current) return
      followingRef.current = false
      setFollowing(false)
    }
    let knownHeight = region()?.scrollHeight ?? 0

    const onWheel = (event: WheelEvent) => {
      // A pinch zoom on a trackpad arrives as a wheel with ctrlKey; a wheel with no delta moves nothing.
      if (event.ctrlKey || (event.deltaX === 0 && event.deltaY === 0)) return
      stop()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (event.target instanceof Element && event.target.closest(OWN_KEYS)) return
      if (SCROLL_KEYS.has(event.key) || (event.key === ' ' && event.shiftKey)) stop()
    }
    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest(SCROLL_REGION)) return
      if (event.button === 1) stop() // the middle button starts autoscroll
      pressOrderRef.current += 1
      held.set(event.pointerId, pressOrderRef.current)
      knownHeight = region()?.scrollHeight ?? knownHeight
    }
    const release = (event: PointerEvent) => void held.delete(event.pointerId)
    const releaseAll = () => held.clear()
    // `scroll` does not bubble, hence the capture.
    const onScroll = (event: Event) => {
      const target = region()
      if (!target || event.target !== target) return
      let lease = codeScrollRef.current
      const now = performance.now()
      if (lease && now > lease.deadline) lease = codeScrollRef.current = null
      const layout = target.scrollHeight !== knownHeight
      knownHeight = target.scrollHeight
      if (lease) {
        const distance = Math.abs(target.scrollTop - lease.target)
        if (pressedSince(lease.since) || (!layout && distance > lease.distance + BACKWARD_PX)) {
          stop() // the user's intent wins over the lease; so does a scroll that goes the other way
          return
        }
        lease.distance = layout ? distance : Math.min(lease.distance, distance)
        if (distance < ARRIVED_PX) lease.deadline = Math.min(lease.deadline, now + ARRIVED_SETTLE_MS)
        return
      }
      if (held.size === 0) return
      // A relayout shows as a change of height; the browser's clamp of the position lands at the new maximum. A scroll that
      // lands elsewhere is the hand's even if the height changed just before it.
      if (layout && target.scrollTop >= target.scrollHeight - target.clientHeight - ARRIVED_PX) return
      stop()
    }
    const onScrollEnd = () => {
      const lease = codeScrollRef.current
      codeScrollRef.current = null
      if (lease && pressedSince(lease.since)) stop() // a press after the call, and the scroll is over: the hand stopped it
    }
    const observer = new MutationObserver(() => {
      if (followingRef.current) scrollToSoundingNote(viewerRoot, reducedRef.current, markCodeScroll)
    })

    viewerRoot.addEventListener('wheel', onWheel, { passive: true })
    viewerRoot.addEventListener('touchmove', stop, { passive: true })
    viewerRoot.addEventListener('keydown', onKeyDown)
    viewerRoot.addEventListener('pointerdown', onPointerDown)
    viewerRoot.addEventListener('scroll', onScroll, true)
    viewerRoot.addEventListener('scrollend', onScrollEnd, true)
    // A press can end without a pointerup (the window loses focus, the pointer capture is taken away): never leave it set.
    // Each pointer is its own press: only its own release lets it go. The window losing focus lets all of them go.
    const ends = ['pointerup', 'pointercancel', 'lostpointercapture'] as const
    for (const type of ends) window.addEventListener(type, release)
    window.addEventListener('blur', releaseAll)
    observer.observe(viewerRoot, { attributes: true, attributeFilter: ['class'], subtree: true })
    return () => {
      viewerRoot.removeEventListener('wheel', onWheel)
      viewerRoot.removeEventListener('touchmove', stop)
      viewerRoot.removeEventListener('keydown', onKeyDown)
      viewerRoot.removeEventListener('pointerdown', onPointerDown)
      viewerRoot.removeEventListener('scroll', onScroll, true)
      viewerRoot.removeEventListener('scrollend', onScrollEnd, true)
      for (const type of ends) window.removeEventListener(type, release)
      window.removeEventListener('blur', releaseAll)
      held.clear()
      observer.disconnect()
    }
  }, [markCodeScroll, viewerRoot])

  const resume = useCallback(() => {
    followingRef.current = true
    codeScrollRef.current = null // starts clean: no claim of an earlier scroll
    setFollowing(true)
    if (!viewerRoot) return
    // The button that asked for this goes away with the state change: the focus moves to the sheet first, or it would
    // fall to <body>, outside the section, and the shortcuts would stop. `preventScroll`: the page must not jump.
    viewerRoot.querySelector<HTMLElement>(SCROLL_REGION)?.focus({ preventScroll: true })
    scrollToSoundingNote(viewerRoot, reducedRef.current, markCodeScroll)
  }, [markCodeScroll, viewerRoot])

  return { following, resume }
}
