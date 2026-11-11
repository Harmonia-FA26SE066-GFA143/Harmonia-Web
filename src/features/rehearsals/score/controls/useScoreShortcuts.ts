import { useEffect, useRef } from 'react'
import type { PlaybackClock } from '../clock/usePlaybackClock'

export type ShortcutClock = Pick<PlaybackClock, 'playing' | 'duration' | 'play' | 'pause' | 'seek' | 'getTime'>

/** Seconds the arrow keys move. */
export const SEEK_STEP = 5

const TYPING = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])'
const PRESSABLE = 'button, a[href], summary, [role="button"]'

/** Whether the target is a field the user types into (also a select: its letters pick an option). */
export function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(TYPING) !== null
}

/** Whether the focused element gives this key a meaning of its own (typing, pressing a button, moving a slider). */
function ownedByTarget(target: EventTarget | null, key: string): boolean {
  if (!(target instanceof Element)) return false
  if (isTypingTarget(target)) return true
  if (key === ' ') return target.closest(PRESSABLE) !== null
  return target.closest('[role="slider"]') !== null
}

/**
 * Space plays/pauses, ←/→ move 5 seconds, Home returns to the start. Scoped to `root` (the practice section): nothing
 * is heard with the focus elsewhere on the page. A key with a modifier, one already handled, a held-down Space, and a
 * key the focused field, button or slider uses itself are left alone.
 */
export function useScoreShortcuts(root: HTMLElement | null, clock: ShortcutClock) {
  // The clock object changes with `playing`/`duration`; the listener reads the latest one and is bound once per root.
  const clockRef = useRef(clock)
  useEffect(() => {
    clockRef.current = clock
  }, [clock])

  useEffect(() => {
    if (!root) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing || event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return
      const { key } = event
      if (key !== ' ' && key !== 'ArrowLeft' && key !== 'ArrowRight' && key !== 'Home') return
      if (ownedByTarget(event.target, key)) return
      event.preventDefault()
      const current = clockRef.current
      if (key === ' ') {
        if (event.repeat) return
        if (current.playing) current.pause()
        else void current.play()
        return
      }
      const { duration, getTime, seek } = current
      const target = key === 'Home' ? 0 : getTime() + (key === 'ArrowRight' ? SEEK_STEP : -SEEK_STEP)
      // Held in [0, duration] here, whatever the clock does: until the duration is known the only place is the start.
      seek(Math.min(Math.max(0, target), Number.isFinite(duration) && duration > 0 ? duration : 0))
    }
    root.addEventListener('keydown', onKeyDown)
    return () => root.removeEventListener('keydown', onKeyDown)
  }, [root])
}
