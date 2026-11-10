import { StrictMode, useEffect } from 'react'
import { act, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ACTIVE_NOTE_CLASS } from './useScoreSync'
import { useFollowScroll } from './useFollowScroll'

// A 400 px tall scroll region with three systems of 100 px. Layout does not exist in jsdom, so rectangles are fed by hand:
// the top of a system on screen is its offset in the page minus the region's scroll position.
const REGION_HEIGHT = 400
const SYSTEM_HEIGHT = 100
const SYSTEM_GAP = 300 // systems start at 0, 300 and 600 in the page

const SCROLL_BAR_X = 695 // inside the gutter, which spans 691–702
const PAPER_X = 300 // the empty margin of the sheet, inside the content

const rect = (top: number, height: number) => ({ top, bottom: top + height, height, left: 0, right: 0, width: 0, x: 0, y: top, toJSON: () => ({}) }) as DOMRect

function setup({ reduced = true, scrollTop = 0, overlayBar = false, inFlight = false }: { reduced?: boolean; scrollTop?: number; overlayBar?: boolean; inFlight?: boolean } = {}) {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: reduced && query.includes('reduce'), media: query, addEventListener() {}, removeEventListener() {} }))
  const root = document.createElement('div')
  root.innerHTML = `<div class="hm-score-scroll" tabindex="0"><svg>${[0, 1, 2]
    .map((system) => `<g class="system" data-system="${system}"><g class="note" id="n${system}a"></g><g class="note" id="n${system}b"></g></g>`)
    .join('')}</svg></div>`
  document.body.append(root)
  const region = root.querySelector<HTMLElement>('.hm-score-scroll')!
  region.scrollTop = scrollTop
  let scrollHeight = 1000 // pages end at 1000: the most it can scroll is 600
  Object.defineProperty(region, 'scrollHeight', { configurable: true, get: () => scrollHeight })
  Object.defineProperty(region, 'clientHeight', { value: REGION_HEIGHT })
  // 702 px wide with a 1 px border on each side: the content is 690 px and the scroll bar takes the 11 px to its right.
  // An overlay bar takes no room: the content is as wide as the whole region.
  Object.defineProperty(region, 'clientWidth', { value: overlayBar ? 702 : 690 })
  Object.defineProperty(region, 'offsetWidth', { value: 702 })
  Object.defineProperty(region, 'clientLeft', { value: 1 })
  region.getBoundingClientRect = () => ({ ...rect(0, REGION_HEIGHT), left: 0, right: 702, width: 702 }) as DOMRect
  // `inFlight`: a smooth scroll that has not arrived yet, so the position changes only when the test moves it.
  const scrollTo = vi.fn(({ top }: ScrollToOptions) => void (inFlight || (region.scrollTop = top ?? 0)))
  region.scrollTo = scrollTo as unknown as typeof region.scrollTo
  const pageTop = (system: number) => system * SYSTEM_GAP
  root.querySelectorAll<HTMLElement>('g.system').forEach((system) => {
    const index = Number(system.dataset.system)
    system.getBoundingClientRect = () => rect(pageTop(index) - region.scrollTop, SYSTEM_HEIGHT)
    system.querySelectorAll<HTMLElement>('g.note').forEach((note, n) => {
      note.getBoundingClientRect = () => rect(pageTop(index) - region.scrollTop + 10 + n * 40, 30)
    })
  })

  const handle: { current: ReturnType<typeof useFollowScroll> | null } = { current: null }
  function Harness() {
    const result = useFollowScroll(root)
    useEffect(() => {
      handle.current = result
    })
    return null
  }
  const view = render(
    <StrictMode>
      <Harness />
    </StrictMode>,
  )
  /** Lights one note the way `useScoreSync` does (a class toggle), then lets the observer run. */
  const light = async (id: string) => {
    await act(async () => {
      root.querySelector(`.${ACTIVE_NOTE_CLASS}`)?.classList.remove(ACTIVE_NOTE_CLASS)
      root.querySelector(`#${id}`)!.classList.add(ACTIVE_NOTE_CLASS)
    })
  }
  const setScrollHeight = (height: number) => void (scrollHeight = height)
  return { root, region, scrollTo, handle, view, light, setScrollHeight }
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('useFollowScroll', () => {
  it('scrolls the system of a note that left the region to the top, with a margin', async () => {
    const { scrollTo, light } = setup()
    await light('n1a') // system 1 starts at 300 in the page, below the region's usable part? it is in view (300+10 < 360)
    expect(scrollTo).not.toHaveBeenCalled()
    await light('n2a') // system 2 starts at 600: outside the 400 px region
    expect(scrollTo).toHaveBeenCalledTimes(1)
    expect(scrollTo).toHaveBeenCalledWith({ top: 600 - REGION_HEIGHT * 0.15, behavior: 'instant' })
  })

  it('scrolls back up when the note is above the region (a seek backwards)', async () => {
    const { scrollTo, light } = setup({ scrollTop: 600 })
    await light('n0a')
    expect(scrollTo).toHaveBeenCalledTimes(1)
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' }) // never below 0
  })

  it('is smooth unless the viewer asked for reduced motion', async () => {
    const { scrollTo, light } = setup({ reduced: false })
    await light('n2a')
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }))
  })

  it('does not scroll while the sounding notes stay in view, and not once per frame', async () => {
    const { scrollTo, light } = setup()
    for (let tick = 0; tick < 60; tick += 1) await light(tick % 2 ? 'n0b' : 'n0a')
    expect(scrollTo).not.toHaveBeenCalled()
    await light('n2a')
    await light('n2a')
    await light('n2b') // same system, already moved there by the first call (the page does not scroll in this fake)
    expect(scrollTo.mock.calls.length).toBeLessThanOrEqual(3)
  })

  it.each([
    ['a wheel', (region: HTMLElement) => fireEvent.wheel(region, { deltaY: 40 })],
    ['a touch drag', (region: HTMLElement) => fireEvent.touchMove(region)],
    ['a scroll key', (region: HTMLElement) => fireEvent.keyDown(region, { key: 'PageDown' })],
    ['a drag of the scroll bar', (region: HTMLElement) => {
      fireEvent.pointerDown(region, { clientX: SCROLL_BAR_X, clientY: 200 })
      fireEvent.scroll(region)
    }],
  ])('stops following after %s, and the next note does not scroll', async (_name, userScroll) => {
    const { region, scrollTo, handle, light } = setup()
    expect(handle.current?.following).toBe(true)
    act(() => void userScroll(region))
    expect(handle.current?.following).toBe(false)
    await light('n2a')
    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('keeps following while the mouse is held on the empty paper and the code scrolls', async () => {
    const { region, handle, scrollTo, light } = setup()
    fireEvent.pointerDown(region, { clientX: PAPER_X, clientY: 100 }) // margin or padding, not the bar
    await light('n2a')
    expect(scrollTo).toHaveBeenCalledTimes(1)
    act(() => void fireEvent.scroll(region)) // the scroll event of that scrollTo, mouse still down
    expect(handle.current?.following).toBe(true)
  })

  it.each([
    ['pointerup', () => fireEvent.pointerUp(window)],
    ['pointercancel', () => fireEvent.pointerCancel(window)],
    ['lostpointercapture', (region: HTMLElement) => fireEvent(region, Object.assign(new Event('lostpointercapture', { bubbles: true }), { pointerId: 0 }))],
    ['window blur', () => fireEvent.blur(window)],
  ])('does not keep a press on the scroll bar alive after %s', (_name, end) => {
    const { region, handle } = setup()
    fireEvent.pointerDown(region, { clientX: SCROLL_BAR_X, clientY: 200 })
    end(region)
    act(() => void fireEvent.scroll(region)) // a later scroll that the code or the browser makes
    expect(handle.current?.following).toBe(true)
  })

  it('keeps following when the content changes height or the browser clamps the scroll position', async () => {
    const { region, handle, light, scrollTo, setScrollHeight } = setup({ scrollTop: 600 })
    await light('n2a')
    setScrollHeight(700) // the sheet got shorter (a real clamp always comes with a new height) ...
    region.scrollTop = 300 // ... and the browser put the position at the new maximum
    act(() => void fireEvent.scroll(region))
    expect(handle.current?.following).toBe(true)
    scrollTo.mockClear()
    await light('n0a')
    expect(scrollTo).toHaveBeenCalledTimes(1)
  })

  it('keeps following when the scroll comes from the code, or from an unrelated key', async () => {
    const { region, handle, light, scrollTo } = setup()
    await light('n2a')
    act(() => void fireEvent.scroll(region)) // the scroll event of scrollTo itself
    act(() => void fireEvent.keyDown(region, { key: 'a' }))
    act(() => void fireEvent.keyDown(region, { key: 'PageDown', ctrlKey: true }))
    expect(handle.current?.following).toBe(true)
    await light('n0a')
    expect(scrollTo).toHaveBeenCalledTimes(2)
  })

  describe('what is a scroll by the user', () => {
    it('a drag of an overlay scroll bar, which takes no room, ends following', () => {
      const { region, handle } = setup({ overlayBar: true })
      expect(region.clientWidth).toBe(region.offsetWidth)
      fireEvent.pointerDown(region, { clientX: 698, clientY: 120 }) // on the thumb, which sits over the content
      act(() => void fireEvent.scroll(region))
      expect(handle.current?.following).toBe(false)
    })

    it('a drag that selects text to the edge, and the browser scrolls, ends following', () => {
      const { root, handle } = setup()
      const region = root.querySelector<HTMLElement>('.hm-score-scroll')!
      fireEvent.pointerDown(root.querySelector('#n0a')!, { clientX: PAPER_X, clientY: 100 }) // on a note, not the region
      act(() => void fireEvent.scroll(region))
      expect(handle.current?.following).toBe(false)
    })

    it('a press alone, without a scroll, changes nothing', () => {
      const { region, handle } = setup()
      fireEvent.pointerDown(region, { clientX: PAPER_X, clientY: 100, button: 0 })
      expect(handle.current?.following).toBe(true)
    })

    it.each([
      ['on the region', (root: HTMLElement) => root.querySelector('.hm-score-scroll')!],
      ['on a note', (root: HTMLElement) => root.querySelector('#n0a')!],
    ])('the middle button pressed %s ends following (autoscroll)', (_name, target) => {
      const { root, handle } = setup()
      fireEvent.pointerDown(target(root), { button: 1, clientX: PAPER_X, clientY: 100 })
      expect(handle.current?.following).toBe(false)
    })

    it('Shift+Space, the browser scroll up, ends following', () => {
      const { region, handle } = setup()
      act(() => void fireEvent.keyDown(region, { key: ' ', shiftKey: true }))
      expect(handle.current?.following).toBe(false)
    })

    it('Space and Home are playback shortcuts and do not end following', () => {
      const { region, handle } = setup()
      act(() => void fireEvent.keyDown(region, { key: ' ' }))
      act(() => void fireEvent.keyDown(region, { key: 'Home' }))
      act(() => void fireEvent.keyDown(region, { key: ' ', shiftKey: true, ctrlKey: true }))
      expect(handle.current?.following).toBe(true)
    })

    it.each(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'End'])('%s ends following', (key) => {
      const { region, handle } = setup()
      act(() => void fireEvent.keyDown(region, { key }))
      expect(handle.current?.following).toBe(false)
    })

    it('a scroll key aimed at a control inside the sheet area that uses it is left to the control', () => {
      const { root, handle } = setup()
      const retry = document.createElement('button')
      root.append(retry)
      for (const key of ['ArrowDown', 'PageDown', ' ']) act(() => void fireEvent.keyDown(retry, { key, shiftKey: key === ' ' }))
      expect(handle.current?.following).toBe(true)
    })
  })

  describe('what is not a scroll by the user', () => {
    it('many scroll events of one smooth scrollTo, with the mouse held, do not end following', async () => {
      const { region, handle, scrollTo, light } = setup({ inFlight: true })
      fireEvent.pointerDown(region, { clientX: PAPER_X, clientY: 100 })
      await light('n2a')
      const target = scrollTo.mock.calls[0][0].top as number
      for (const top of [40, 150, 300, target - 3]) {
        region.scrollTop = top
        act(() => void fireEvent.scroll(region))
      }
      expect(handle.current?.following).toBe(true)
      region.scrollTop = target // arrived
      act(() => void fireEvent.scroll(region))
      expect(handle.current?.following).toBe(true)
    })

    it('the last scroll events of a smooth scroll, a sub-pixel tail after the target was reached, are still the code\'s', async () => {
      const { region, handle, scrollTo, light } = setup({ inFlight: true })
      const now = vi.spyOn(performance, 'now').mockReturnValue(10_000)
      fireEvent.pointerDown(region, { clientX: PAPER_X, clientY: 100 })
      await light('n2a')
      const target = scrollTo.mock.calls[0][0].top as number
      for (const [at, top] of [
        [10_300, target - 0.4],
        [10_320, target - 0.1],
        [10_340, target],
      ] as const) {
        now.mockReturnValue(at)
        region.scrollTop = top // within half a pixel of the target from the first of these on
        act(() => void fireEvent.scroll(region))
      }
      expect(handle.current?.following).toBe(true)
    })

    it('once the code scroll has arrived and settled, a scroll with the mouse held is the user\'s', async () => {
      const { region, handle, scrollTo, light } = setup({ inFlight: true })
      const now = vi.spyOn(performance, 'now').mockReturnValue(10_000)
      fireEvent.pointerDown(region, { clientX: PAPER_X, clientY: 100 })
      await light('n2a')
      now.mockReturnValue(10_300)
      region.scrollTop = scrollTo.mock.calls[0][0].top as number
      act(() => void fireEvent.scroll(region)) // arrival
      now.mockReturnValue(10_450) // 150 ms later: settled
      region.scrollTop += 80
      act(() => void fireEvent.scroll(region)) // the hand, still on the paper
      expect(handle.current?.following).toBe(false)
    })

    it('scrollend ends the code scroll even when the position never reached the target', async () => {
      const { region, handle, light } = setup({ inFlight: true })
      fireEvent.pointerDown(region, { clientX: PAPER_X, clientY: 100 })
      await light('n2a')
      region.scrollTop = 300
      act(() => void fireEvent.scroll(region))
      expect(handle.current?.following).toBe(true)
      act(() => void fireEvent(region, new Event('scrollend')))
      region.scrollTop = 340
      act(() => void fireEvent.scroll(region))
      expect(handle.current?.following).toBe(false)
    })

    it('a code scroll that never reports its end stops counting after one second', async () => {
      const { region, handle, light } = setup({ inFlight: true })
      const now = vi.spyOn(performance, 'now').mockReturnValue(10_000)
      fireEvent.pointerDown(region, { clientX: PAPER_X, clientY: 100 })
      await light('n2a')
      now.mockReturnValue(10_900)
      region.scrollTop = 200
      act(() => void fireEvent.scroll(region))
      expect(handle.current?.following).toBe(true)
      now.mockReturnValue(11_001)
      region.scrollTop = 260
      act(() => void fireEvent.scroll(region))
      expect(handle.current?.following).toBe(false)
    })

    it('a resume scroll is the code\'s too', () => {
      const { region, handle, scrollTo } = setup({ inFlight: true })
      fireEvent.pointerDown(region, { clientX: PAPER_X, clientY: 100 })
      act(() => void fireEvent.wheel(region, { deltaY: 40 })) // following ends
      region.scrollTop = 0
      scrollTo.mockClear()
      // light a far note so that resume has somewhere to go
      region.querySelector('#n2a')!.classList.add(ACTIVE_NOTE_CLASS)
      act(() => handle.current?.resume())
      expect(scrollTo).toHaveBeenCalledTimes(1)
      region.scrollTop = 150
      act(() => void fireEvent.scroll(region))
      expect(handle.current?.following).toBe(true)
    })

    it('a scroll after the content changed height (a relayout, a clamp), with the mouse held, is not the user\'s', () => {
      const { region, handle, setScrollHeight } = setup({ scrollTop: 500 })
      fireEvent.pointerDown(region, { clientX: PAPER_X, clientY: 100 })
      setScrollHeight(700) // the sheet got shorter, the browser clamps the position
      region.scrollTop = 300
      act(() => void fireEvent.scroll(region))
      expect(handle.current?.following).toBe(true)
      region.scrollTop = 340 // the same height now: this one is the hand's
      act(() => void fireEvent.scroll(region))
      expect(handle.current?.following).toBe(false)
    })

    it('a relayout while no button is held does not leave a stale height behind', () => {
      const { region, handle, setScrollHeight } = setup()
      setScrollHeight(1400) // a relayout, nobody scrolling
      fireEvent.pointerDown(region, { clientX: PAPER_X, clientY: 100 }) // the next press starts from the new height
      region.scrollTop = 120
      act(() => void fireEvent.scroll(region))
      expect(handle.current?.following).toBe(false)
    })

    it.each([
      ['ctrl+wheel (pinch zoom)', { deltaY: 40, ctrlKey: true }],
      ['a wheel without a delta', { deltaX: 0, deltaY: 0 }],
    ])('%s does not end following', (_name, init) => {
      const { region, handle } = setup()
      act(() => void fireEvent.wheel(region, init))
      expect(handle.current?.following).toBe(true)
    })

    it.each([
      ['vertical', { deltaY: 40 }],
      ['sideways', { deltaX: 30 }],
    ])('a plain %s wheel still ends following', (_name, init) => {
      const { region, handle } = setup()
      act(() => void fireEvent.wheel(region, init))
      expect(handle.current?.following).toBe(false)
    })
  })

  // F3-I: what the user does beats the code's claim to a scroll.
  describe('the user wins over a code scroll in flight', () => {
    const scrollTopTo = (region: HTMLElement, top: number) => {
      region.scrollTop = top
      act(() => void fireEvent.scroll(region))
    }

    it('pressing the scroll bar after the call and dragging ends following', async () => {
      const { region, handle, light } = setup({ inFlight: true })
      await light('n2a')
      fireEvent.pointerDown(region, { clientX: SCROLL_BAR_X, clientY: 200 }) // after the scrollTo
      scrollTopTo(region, 120)
      expect(handle.current?.following).toBe(false)
    })

    it.each([
      ['a middle press', { button: 1 }],
      ['a right press', { button: 2 }],
    ])('%s after the call counts as the user too, once it scrolls', async (_name, init) => {
      const { region, handle, light } = setup({ inFlight: true })
      await light('n2a')
      fireEvent.pointerDown(region, { clientX: PAPER_X, clientY: 100, ...init })
      scrollTopTo(region, 120)
      expect(handle.current?.following).toBe(false)
    })

    it('a press that was already released is not a hand on the scroll: a click does not end following', async () => {
      const { region, handle, light } = setup({ inFlight: true })
      await light('n2a')
      fireEvent.pointerDown(region, { clientX: PAPER_X, clientY: 100 })
      fireEvent.pointerUp(window)
      scrollTopTo(region, 120)
      expect(handle.current?.following).toBe(true)
    })

    it('a press right before the call (the hold on the paper) is not the user scrolling', async () => {
      const { region, handle, light } = setup({ inFlight: true })
      fireEvent.pointerDown(region, { clientX: SCROLL_BAR_X, clientY: 200 })
      await light('n2a')
      scrollTopTo(region, 120)
      expect(handle.current?.following).toBe(true)
    })

    it('a press between two calls of one chain still counts as after the first', async () => {
      const { region, handle, light } = setup({ inFlight: true })
      await light('n2a')
      fireEvent.pointerDown(region, { clientX: SCROLL_BAR_X, clientY: 200 })
      region.scrollTop = 100
      await light('n0a') // the code calls again (a new target)
      scrollTopTo(region, 60)
      expect(handle.current?.following).toBe(false)
    })

    it('the scrollend of a scroll the user interrupted ends following, not just the code scroll', async () => {
      const { region, handle, light } = setup({ inFlight: true })
      await light('n2a')
      fireEvent.pointerDown(region, { clientX: SCROLL_BAR_X, clientY: 200 })
      act(() => void fireEvent(region, new Event('scrollend')))
      expect(handle.current?.following).toBe(false)
    })

    it('the scrollend of the code scroll, with nobody pressing, changes nothing but the end of the code scroll', async () => {
      const { region, handle, light } = setup({ inFlight: true })
      await light('n2a')
      act(() => void fireEvent(region, new Event('scrollend')))
      expect(handle.current?.following).toBe(true)
    })

    it('calls that overlap do not stretch the lease past one second from the first', async () => {
      const { region, handle, light } = setup({ inFlight: true })
      const now = vi.spyOn(performance, 'now').mockReturnValue(10_000)
      fireEvent.pointerDown(region, { clientX: PAPER_X, clientY: 100 }) // held before the chain: never the user's by itself
      await light('n2a') // chain begins at 10 000, ends at 11 000
      now.mockReturnValue(10_600)
      region.scrollTop = 300
      await light('n0a') // a second call
      now.mockReturnValue(10_900)
      region.scrollTop = 100
      await light('n2a') // a third call: the cap does not move
      now.mockReturnValue(10_950)
      scrollTopTo(region, 400)
      expect(handle.current?.following).toBe(true) // inside the cap
      now.mockReturnValue(11_050)
      scrollTopTo(region, 430)
      expect(handle.current?.following).toBe(false) // past it: the hold on the paper is a hand
    })

    it('a scroll away from the target, or against the direction of the call, is the user\'s', async () => {
      const { region, handle, light } = setup({ inFlight: true })
      await light('n2a') // from 0 to 540
      scrollTopTo(region, 100)
      expect(handle.current?.following).toBe(true)
      scrollTopTo(region, 140)
      expect(handle.current?.following).toBe(true)
      scrollTopTo(region, 20) // back towards where it began
      expect(handle.current?.following).toBe(false)
    })

    it('a small step back (rounding of a smooth scroll) is not a reversal', async () => {
      const { region, handle, light } = setup({ inFlight: true })
      await light('n2a')
      scrollTopTo(region, 300)
      scrollTopTo(region, 299)
      expect(handle.current?.following).toBe(true)
    })

    it('a call after the lease went on a new target is judged by the new one', async () => {
      const { region, handle, light } = setup({ inFlight: true })
      await light('n2a') // to 540
      scrollTopTo(region, 480) // 60 from the old target
      await light('n0a') // a seek backwards: a new call, now towards 0
      scrollTopTo(region, 440) // 380 from the old target, far more than the 60 seen: right for the new one
      expect(handle.current?.following).toBe(true)
    })

    it('a stop clears the lease: after a resume that does not scroll, a held press is the user\'s again', async () => {
      const { region, handle, light } = setup({ inFlight: true })
      fireEvent.pointerDown(region, { clientX: PAPER_X, clientY: 100 })
      await light('n2a') // a lease is open
      act(() => void fireEvent.wheel(region, { deltaY: 40 })) // following ends, the lease with it
      region.querySelector(`.${ACTIVE_NOTE_CLASS}`)?.classList.remove(ACTIVE_NOTE_CLASS) // nothing to bring into view
      act(() => handle.current?.resume())
      expect(handle.current?.following).toBe(true)
      scrollTopTo(region, 50) // no call of the code stands behind this scroll
      expect(handle.current?.following).toBe(false)
    })
  })

  // F3-M1: a layout change between the press and the scroll must not swallow the hand's scroll.
  describe('a relayout between the press and the scroll', () => {
    it('the hand\'s scroll that lands somewhere other than the clamp still ends following', () => {
      const { region, handle, setScrollHeight } = setup()
      fireEvent.pointerDown(region, { clientX: SCROLL_BAR_X, clientY: 200 })
      setScrollHeight(1400) // a relayout after the press, before the first scroll
      region.scrollTop = 120
      act(() => void fireEvent.scroll(region))
      expect(handle.current?.following).toBe(false)
    })

    it('a relayout alone ends nothing', () => {
      const { region, handle, setScrollHeight } = setup({ scrollTop: 500 })
      setScrollHeight(700)
      region.scrollTop = 300
      act(() => void fireEvent.scroll(region))
      expect(handle.current?.following).toBe(true)
    })
  })

  // F3-M2: each pointer is its own press.
  describe('several pointers', () => {
    it('the release of another pointer leaves the first one\'s press standing', () => {
      const { region, handle } = setup()
      fireEvent.pointerDown(region, { clientX: SCROLL_BAR_X, clientY: 200, pointerId: 1 })
      fireEvent.pointerDown(region, { clientX: PAPER_X, clientY: 100, pointerId: 2 })
      fireEvent.pointerUp(window, { pointerId: 2 })
      region.scrollTop = 120
      act(() => void fireEvent.scroll(region))
      expect(handle.current?.following).toBe(false)
    })

    it('the cancel and the lost capture of another pointer leave it standing too', () => {
      const { region, handle } = setup()
      fireEvent.pointerDown(region, { clientX: SCROLL_BAR_X, clientY: 200, pointerId: 1 })
      fireEvent.pointerCancel(window, { pointerId: 2 })
      fireEvent(region, Object.assign(new Event('lostpointercapture', { bubbles: true }), { pointerId: 3 }))
      region.scrollTop = 120
      act(() => void fireEvent.scroll(region))
      expect(handle.current?.following).toBe(false)
    })

    it('the release of every pointer ends the press', () => {
      const { region, handle } = setup()
      fireEvent.pointerDown(region, { clientX: SCROLL_BAR_X, clientY: 200, pointerId: 1 })
      fireEvent.pointerDown(region, { clientX: PAPER_X, clientY: 100, pointerId: 2 })
      fireEvent.pointerUp(window, { pointerId: 2 })
      fireEvent.pointerUp(window, { pointerId: 1 })
      region.scrollTop = 120
      act(() => void fireEvent.scroll(region))
      expect(handle.current?.following).toBe(true)
    })

    it('a window blur ends them all', () => {
      const { region, handle } = setup()
      fireEvent.pointerDown(region, { clientX: SCROLL_BAR_X, clientY: 200, pointerId: 1 })
      fireEvent.pointerDown(region, { clientX: PAPER_X, clientY: 100, pointerId: 2 })
      fireEvent.blur(window)
      region.scrollTop = 120
      act(() => void fireEvent.scroll(region))
      expect(handle.current?.following).toBe(true)
    })
  })

  it('resume follows again and scrolls to the sounding note', async () => {
    const { region, scrollTo, handle, light } = setup()
    await light('n2a')
    scrollTo.mockClear()
    act(() => void fireEvent.wheel(region, { deltaY: 40 }))
    region.scrollTop = 0 // the user scrolled away from the sounding note
    expect(handle.current?.following).toBe(false)
    act(() => handle.current?.resume())
    expect(handle.current?.following).toBe(true)
    expect(scrollTo).toHaveBeenCalledTimes(1)
    await light('n0a')
    expect(scrollTo).toHaveBeenCalledTimes(2)
  })

  it('resume puts the focus on the scroll region without scrolling the page', () => {
    const { region, handle } = setup()
    const focus = vi.spyOn(region, 'focus')
    act(() => handle.current?.resume())
    expect(focus).toHaveBeenCalledWith({ preventScroll: true })
    expect(document.activeElement).toBe(region)
  })

  it('removes its listeners and observer on unmount', async () => {
    const { region, scrollTo, view, light } = setup()
    const remove = vi.spyOn(HTMLElement.prototype, 'removeEventListener')
    view.unmount()
    expect(remove.mock.calls.map(([type]) => type)).toEqual(expect.arrayContaining(['wheel', 'touchmove', 'keydown']))
    await light('n2a')
    fireEvent.wheel(region, { deltaY: 40 })
    expect(scrollTo).not.toHaveBeenCalled()
  })
})
