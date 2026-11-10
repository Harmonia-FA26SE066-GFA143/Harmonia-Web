import { StrictMode } from 'react'
import { fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { parseTimemap } from '../timeline/parseTimemap'
import { NOTE_TOLERANCE_PX } from './findNoteAt'
import { useNoteSeek } from './useNoteSeek'

// a plays 0–1 s and again 10–11 s (a repeat); b plays 1–2 s; c plays 2–3 s. `quiet` is on the sheet but never plays.
const timeline = parseTimemap([
  { tstamp: 0, on: ['a'] },
  { tstamp: 1000, off: ['a'], on: ['b'] },
  { tstamp: 2000, off: ['b'], on: ['c'] },
  { tstamp: 3000, off: ['c'] },
  { tstamp: 10000, on: ['a'] },
  { tstamp: 11000, off: ['a'] },
])

// The head of each note sits at (HEAD_X[id], HEAD_Y); clicks fired without coordinates land at (0, 0), far from all.
const HEAD_X: Record<string, number> = { a: 100, b: 160, c: 220, quiet: 280 }
const HEAD_Y = 100

const markup = (...ids: string[]) =>
  `<svg xmlns="http://www.w3.org/2000/svg"><g id="staff" class="staff"><path id="staff-line" d="M0 0"/></g><rect id="paper" width="9" height="9"/>${ids
    .map((id) => `<g id="${id}" class="note"><g class="notehead"><path id="${id}-head" d="M0 0"/></g><g class="stem"><path id="${id}-stem" d="M0 0"/></g></g>`)
    .join('')}</svg>`

/** jsdom has no layout: give every notehead the box it would have, 17 x 14 px around its centre. */
function layout(root: HTMLElement) {
  root.querySelectorAll('g.note').forEach((note) => {
    const x = HEAD_X[note.id] ?? 400
    note.querySelector('g.notehead')!.getBoundingClientRect = () => ({ left: x - 8.5, top: HEAD_Y - 7, width: 17, height: 14, right: x + 8.5, bottom: HEAD_Y + 7, x: x - 8.5, y: HEAD_Y - 7, toJSON: () => ({}) })
  })
}

function newRoot() {
  const root = document.createElement('div')
  root.innerHTML = markup('a', 'b', 'c', 'quiet')
  layout(root)
  document.body.append(root)
  return root
}

function setup(start = 0) {
  let time = start
  const seek = vi.fn((seconds: number) => {
    time = seconds
  })
  const clock = { seek, getTime: () => time }
  const root = newRoot()
  const add = vi.spyOn(root, 'addEventListener')
  const remove = vi.spyOn(root, 'removeEventListener')
  function Harness() {
    useNoteSeek(clock, root, timeline.onsets)
    return null
  }
  const view = render(<Harness />)
  return { root, seek, add, remove, view, setTime: (next: number) => void (time = next) }
}

/** A click as the browser makes it: press, move, release, click. */
function press(target: Element, from: [number, number], moves: [number, number][], to: [number, number], pointerId = 1) {
  fireEvent.pointerDown(target, { clientX: from[0], clientY: from[1], pointerId })
  for (const [x, y] of moves) fireEvent.pointerMove(target, { clientX: x, clientY: y, pointerId })
  fireEvent.pointerUp(target, { clientX: to[0], clientY: to[1], pointerId })
  fireEvent.click(target, { clientX: to[0], clientY: to[1] })
}

afterEach(() => {
  HEAD_X.quiet = 280 // one test moves it
  document.body.innerHTML = ''
  vi.restoreAllMocks()
  window.getSelection()?.removeAllRanges()
})

describe('useNoteSeek, which note', () => {
  it('seeks to the onset of the clicked note, also from a child of the note group', () => {
    const { root, seek } = setup()
    fireEvent.click(root.querySelector('#b')!)
    expect(seek).toHaveBeenLastCalledWith(1)
    fireEvent.click(root.querySelector('#c-stem')!) // the stem is part of the note
    expect(seek).toHaveBeenLastCalledWith(2)
  })

  it('a click beside the ink, within the tolerance of a notehead, means that note', () => {
    const { root, seek } = setup()
    const paper = root.querySelector('#paper')!
    fireEvent.click(paper, { clientX: HEAD_X.b + 10, clientY: HEAD_Y + 6 })
    expect(seek).toHaveBeenLastCalledWith(1)
    fireEvent.click(paper, { clientX: HEAD_X.c - NOTE_TOLERANCE_PX, clientY: HEAD_Y })
    expect(seek).toHaveBeenLastCalledWith(2)
  })

  it('a click farther than the tolerance from every notehead does nothing', () => {
    const { root, seek } = setup()
    fireEvent.click(root.querySelector('#paper')!, { clientX: HEAD_X.b + NOTE_TOLERANCE_PX + 2, clientY: HEAD_Y })
    fireEvent.click(root.querySelector('#staff-line')!, { clientX: 5, clientY: 5 })
    fireEvent.click(root)
    expect(seek).not.toHaveBeenCalled()
  })

  it('the nearer of two notes wins', () => {
    const { root, seek } = setup()
    // a and b are 60 px apart; use a tolerance-wide point nearer to b
    fireEvent.click(root.querySelector('#paper')!, { clientX: 148, clientY: HEAD_Y })
    expect(seek).toHaveBeenLastCalledWith(1)
  })

  it('skips a note the timeline does not know, in favour of the next nearest in tolerance', () => {
    const { root, seek } = setup()
    fireEvent.click(root.querySelector('#paper')!, { clientX: HEAD_X.quiet - 4, clientY: HEAD_Y }) // only `quiet`: no onset
    expect(seek).not.toHaveBeenCalled()
    fireEvent.click(root.querySelector('#quiet')!) // a direct hit on it is no better
    expect(seek).not.toHaveBeenCalled()
  })

  it('a direct hit on a note without onsets falls back to a note with onsets within the tolerance', () => {
    const { root, seek } = setup()
    HEAD_X.quiet = 180 // 20 px from b: the direct hit is on `quiet`, and b is the note with onsets nearby
    layout(root)
    fireEvent.click(root.querySelector('#quiet-head')!, { clientX: 172, clientY: HEAD_Y })
    expect(seek).toHaveBeenLastCalledWith(1)
    HEAD_X.quiet = 280
  })
})

describe('useNoteSeek, which occurrence', () => {
  it('picks the onset nearest in time to the current time, the earlier on a tie', () => {
    const { root, seek, setTime } = setup(0.05)
    const click = () => fireEvent.click(root.querySelector('#a')!)
    click()
    expect(seek).toHaveBeenLastCalledWith(0)
    setTime(9)
    click()
    expect(seek).toHaveBeenLastCalledWith(10)
    setTime(10.05)
    click()
    expect(seek).toHaveBeenLastCalledWith(10)
    setTime(20) // past both: the second is nearer, no wrap to the first
    click()
    expect(seek).toHaveBeenLastCalledWith(10)
    setTime(5) // equally far from both: the earlier
    click()
    expect(seek).toHaveBeenLastCalledWith(0)
    setTime(5.01)
    click()
    expect(seek).toHaveBeenLastCalledWith(10)
  })
})

describe('useNoteSeek, what is a click', () => {
  it('ignores a button other than the main one and a click with a modifier', () => {
    const { root, seek } = setup()
    const note = root.querySelector('#b')!
    for (const init of [{ button: 1 }, { button: 2 }, { ctrlKey: true }, { altKey: true }, { metaKey: true }, { shiftKey: true }]) {
      fireEvent.click(note, init)
    }
    expect(seek).not.toHaveBeenCalled()
    fireEvent.click(note, { button: 0 })
    expect(seek).toHaveBeenCalledTimes(1)
  })

  it('a press that moved little and came back is a click', () => {
    const { root, seek } = setup()
    press(root.querySelector('#b')!, [10, 10], [[12, 11]], [12, 11])
    expect(seek).toHaveBeenCalledTimes(1)
  })

  it('does not seek after a drag, even one that came back near the press', () => {
    const { root, seek } = setup()
    const note = root.querySelector('#b')!
    press(note, [10, 10], [[60, 10]], [60, 10])
    expect(seek).not.toHaveBeenCalled()
    press(note, [10, 10], [[200, 10], [11, 10]], [11, 10]) // far, then back
    expect(seek).not.toHaveBeenCalled()
  })

  it('counts only the moves of the pointer that pressed', () => {
    const { root, seek } = setup()
    const note = root.querySelector('#b')!
    fireEvent.pointerDown(note, { clientX: 10, clientY: 10, pointerId: 1 })
    fireEvent.pointerMove(note, { clientX: 300, clientY: 300, pointerId: 2 }) // another finger
    fireEvent.pointerUp(note, { clientX: 10, clientY: 10, pointerId: 1 })
    fireEvent.click(note, { clientX: 10, clientY: 10 })
    expect(seek).toHaveBeenCalledTimes(1)
  })

  it('a drag does not leak into the next click, and a cancelled press is no click', () => {
    const { root, seek } = setup()
    const note = root.querySelector('#b')!
    press(note, [10, 10], [[90, 10]], [90, 10]) // a drag
    fireEvent.click(note) // a click that has no press of its own
    expect(seek).toHaveBeenCalledTimes(1)
    fireEvent.pointerDown(note, { clientX: 10, clientY: 10, pointerId: 1 })
    fireEvent.pointerMove(note, { clientX: 90, clientY: 10, pointerId: 1 })
    fireEvent.pointerCancel(note, { pointerId: 1 })
    fireEvent.click(note) // F3-M3: the browser dropped the gesture; a click it still sends is not a click
    expect(seek).toHaveBeenCalledTimes(1)
    press(note, [10, 10], [], [10, 10])
    expect(seek).toHaveBeenCalledTimes(2)
  })

  describe('the life of a press', () => {
    const outside = () => document.body

    it('a drag that goes out of the viewer and comes back is still a drag', () => {
      const { root, seek } = setup()
      const note = root.querySelector('#b')!
      fireEvent.pointerDown(note, { clientX: 10, clientY: 10, pointerId: 1 })
      fireEvent.pointerMove(outside(), { clientX: 900, clientY: 10, pointerId: 1 }) // far, out of the viewer
      fireEvent.pointerMove(note, { clientX: 11, clientY: 10, pointerId: 1 })
      fireEvent.pointerUp(note, { clientX: 11, clientY: 10, pointerId: 1 })
      fireEvent.click(note, { clientX: 11, clientY: 10 })
      expect(seek).not.toHaveBeenCalled()
    })

    it('a release outside the viewer forgets the press and drops the listeners', () => {
      const { root, seek } = setup()
      const remove = vi.spyOn(window, 'removeEventListener')
      const note = root.querySelector('#b')!
      fireEvent.pointerDown(note, { clientX: 10, clientY: 10, pointerId: 1 })
      fireEvent.pointerMove(outside(), { clientX: 900, clientY: 10, pointerId: 1 })
      fireEvent.pointerUp(outside(), { clientX: 900, clientY: 10, pointerId: 1 })
      const removed = remove.mock.calls.map(([type]) => type)
      expect(removed).toEqual(expect.arrayContaining(['pointermove', 'pointerup', 'pointercancel']))
      // a click that has no press of its own is not judged by that drag
      fireEvent.click(note)
      expect(seek).toHaveBeenCalledTimes(1)
      // and further moves are not listened to any more
      fireEvent.pointerMove(outside(), { clientX: 500, clientY: 10, pointerId: 1 })
      fireEvent.click(note)
      expect(seek).toHaveBeenCalledTimes(2)
    })

    it('the release of a second pointer does not end the press of the first', () => {
      const { root, seek } = setup()
      const note = root.querySelector('#b')!
      fireEvent.pointerDown(note, { clientX: 10, clientY: 10, pointerId: 1 })
      const remove = vi.spyOn(window, 'removeEventListener') // from here: what the second pointer does
      fireEvent.pointerDown(note, { clientX: 40, clientY: 40, pointerId: 2 })
      fireEvent.pointerUp(note, { clientX: 40, clientY: 40, pointerId: 2 })
      expect(remove).not.toHaveBeenCalled()
      fireEvent.pointerMove(note, { clientX: 120, clientY: 10, pointerId: 1 }) // the first is still being dragged
      fireEvent.pointerUp(note, { clientX: 120, clientY: 10, pointerId: 1 })
      fireEvent.click(note, { clientX: 120, clientY: 10 })
      expect(seek).not.toHaveBeenCalled()
    })

    it('the cancel of another pointer does not forget the press', () => {
      const { root, seek } = setup()
      const note = root.querySelector('#b')!
      fireEvent.pointerDown(note, { clientX: 10, clientY: 10, pointerId: 1 })
      fireEvent.pointerMove(note, { clientX: 120, clientY: 10, pointerId: 1 })
      fireEvent.pointerCancel(note, { pointerId: 2 })
      fireEvent.pointerUp(note, { clientX: 120, clientY: 10, pointerId: 1 })
      fireEvent.click(note)
      expect(seek).not.toHaveBeenCalled()
    })

    it('the moves of a second pointer do not turn a click into a drag', () => {
      const { root, seek } = setup()
      const note = root.querySelector('#b')!
      fireEvent.pointerDown(note, { clientX: 10, clientY: 10, pointerId: 1 })
      fireEvent.pointerDown(note, { clientX: 300, clientY: 300, pointerId: 2 })
      fireEvent.pointerMove(note, { clientX: 340, clientY: 300, pointerId: 2 })
      fireEvent.pointerUp(note, { clientX: 340, clientY: 300, pointerId: 2 })
      fireEvent.pointerUp(note, { clientX: 10, clientY: 10, pointerId: 1 })
      fireEvent.click(note)
      expect(seek).toHaveBeenCalledTimes(1)
    })

    // F3-M3: a gesture that was lost (capture taken away, window blurred, cancelled) before its release is no click, even if
    // the browser still sends one: the press was forgotten, and a click with no press behind it must not read as a plain click.
    it.each([
      ['a lost pointer capture', (note: Element) => fireEvent(note, Object.assign(new Event('lostpointercapture', { bubbles: true }), { pointerId: 1 }))],
      ['a window blur', () => fireEvent.blur(window)],
      ['a pointer cancel', (note: Element) => fireEvent.pointerCancel(note, { pointerId: 1 })],
    ])('%s before the release leaves the click that may still come no click, until the next press', (_name, lose) => {
      const { root, seek } = setup()
      const note = root.querySelector('#b')!
      fireEvent.pointerDown(note, { clientX: 10, clientY: 10, pointerId: 1 })
      fireEvent.pointerMove(note, { clientX: 120, clientY: 10, pointerId: 1 })
      lose(note)
      fireEvent.click(note) // a click with no pointerdown of its own
      fireEvent.click(note)
      expect(seek).not.toHaveBeenCalled()
      press(note, [10, 10], [], [10, 10]) // a new press: the next click is a click again
      expect(seek).toHaveBeenCalledTimes(1)
    })

    it('a normal click still seeks, and the lost capture that follows a touch release does not matter', () => {
      const { root, seek } = setup()
      const note = root.querySelector('#b')!
      fireEvent.pointerDown(note, { clientX: 10, clientY: 10, pointerId: 1 })
      fireEvent.pointerUp(note, { clientX: 10, clientY: 10, pointerId: 1 })
      fireEvent(note, Object.assign(new Event('lostpointercapture', { bubbles: true }), { pointerId: 1 })) // after pointerup, before click
      fireEvent.click(note)
      expect(seek).toHaveBeenCalledTimes(1)
    })
  })

  it('a selection elsewhere on the page, outside the sheet, does not eat the click', () => {
    const { root, seek } = setup()
    const elsewhere = document.createElement('p')
    elsewhere.textContent = 'Lịch tập'
    document.body.append(elsewhere)
    const range = document.createRange()
    range.selectNodeContents(elsewhere)
    window.getSelection()?.addRange(range)
    fireEvent.click(root.querySelector('#b')!)
    expect(seek).toHaveBeenCalledTimes(1)
  })

  it('a selection that starts in the sheet and ends outside it still counts as selecting text', () => {
    const { root, seek } = setup()
    const elsewhere = document.createElement('p')
    elsewhere.textContent = 'Lịch tập'
    document.body.append(elsewhere)
    const range = document.createRange()
    range.setStart(root.querySelector('svg')!, 0)
    range.setEnd(elsewhere, 1)
    window.getSelection()?.addRange(range)
    fireEvent.click(root.querySelector('#b')!)
    expect(seek).not.toHaveBeenCalled()
  })

  it('a selection left in the sheet by an earlier gesture does not eat the next click', () => {
    const { root, seek } = setup()
    const range = document.createRange()
    range.selectNodeContents(root)
    window.getSelection()?.addRange(range) // still there when the next press starts
    const note = root.querySelector('#b')!
    fireEvent.pointerDown(note, { clientX: 5, clientY: 5, pointerId: 1 })
    fireEvent.pointerUp(note, { clientX: 5, clientY: 5, pointerId: 1 })
    fireEvent.click(note)
    expect(seek).toHaveBeenCalledTimes(1)
  })

  it('text selected by this very gesture (a double click selects a word) is not a click', () => {
    const { root, seek } = setup()
    const note = root.querySelector('#b')!
    fireEvent.pointerDown(note, { clientX: 5, clientY: 5, pointerId: 1 })
    const range = document.createRange()
    range.selectNodeContents(root) // made by the browser after the press began
    window.getSelection()?.addRange(range)
    fireEvent.pointerUp(note, { clientX: 5, clientY: 5, pointerId: 1 })
    fireEvent.click(note)
    expect(seek).not.toHaveBeenCalled()
  })

  it('does not seek while text is selected', () => {
    const { root, seek } = setup()
    const range = document.createRange()
    range.selectNodeContents(root)
    window.getSelection()?.addRange(range)
    fireEvent.click(root.querySelector('#b')!)
    expect(seek).not.toHaveBeenCalled()
  })
})

describe('useNoteSeek, lifecycle', () => {
  it('keeps working after the sheet replaced its notes, with one click listener on the root', () => {
    const { root, seek, add } = setup()
    root.innerHTML = markup('a', 'b', 'c') // a relayout swaps every child
    layout(root)
    fireEvent.click(root.querySelector('#c')!)
    expect(seek).toHaveBeenCalledTimes(1)
    expect(add.mock.calls.filter(([type]) => type === 'click')).toHaveLength(1)
    expect(add.mock.calls.filter(([type]) => type === 'pointerdown')).toHaveLength(1)
  })

  it('under StrictMode seeks once per click, and unmount removes every listener it added', () => {
    let time = 0
    const seek = vi.fn()
    const root = newRoot()
    const add = vi.spyOn(root, 'addEventListener')
    const remove = vi.spyOn(root, 'removeEventListener')
    const addWindow = vi.spyOn(window, 'addEventListener')
    const removeWindow = vi.spyOn(window, 'removeEventListener')
    function Harness() {
      useNoteSeek({ seek, getTime: () => time }, root, timeline.onsets)
      return null
    }
    const view = render(
      <StrictMode>
        <Harness />
      </StrictMode>,
    )
    fireEvent.pointerDown(root.querySelector('#b')!, { clientX: 1, clientY: 1, pointerId: 1 }) // starts tracking moves
    fireEvent.click(root.querySelector('#b')!)
    expect(seek).toHaveBeenCalledTimes(1)
    view.unmount()
    const added = new Set(add.mock.calls.map(([type]) => type))
    const removed = new Set(remove.mock.calls.map(([type]) => type))
    for (const type of added) expect(removed.has(type)).toBe(true)
    const pointerAdded = new Set(addWindow.mock.calls.map(([type]) => type).filter((type) => type.startsWith('pointer')))
    const pointerRemoved = new Set(removeWindow.mock.calls.map(([type]) => type))
    expect(pointerAdded.size).toBeGreaterThan(0) // a press was open when the hook went away
    for (const type of pointerAdded) expect(pointerRemoved.has(type)).toBe(true)
    fireEvent.click(root.querySelector('#b')!)
    expect(seek).toHaveBeenCalledTimes(1)
    time = 1
  })

  it('does nothing without a root or timeline', () => {
    const seek = vi.fn()
    const root = newRoot()
    function Harness() {
      useNoteSeek({ seek, getTime: () => 0 }, root, null)
      return null
    }
    render(<Harness />)
    fireEvent.click(root.querySelector('#a')!)
    expect(seek).not.toHaveBeenCalled()
  })
})
