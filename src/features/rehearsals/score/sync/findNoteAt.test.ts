import { afterEach, describe, expect, it, vi } from 'vitest'
import { findNoteAt, NOTE_TOLERANCE_PX } from './findNoteAt'

interface Head {
  id: string
  x: number // centre of the notehead, client px
  y: number
  head?: boolean // false: the note has no notehead element
}

const svg = (className: string) => {
  const element = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  element.setAttribute('class', className)
  return element
}

const rect = (x: number, y: number, w: number, h: number) =>
  ({ x, y, left: x, top: y, width: w, height: h, right: x + w, bottom: y + h, toJSON: () => ({}) }) as DOMRect

/** One system 400 px wide and 80 px tall at (0, 0), and a second one far below at y = 1000. */
function build(notes: Head[], lower: Head[] = []) {
  const root = document.createElement('div')
  const system = (heads: Head[], top: number) => {
    const g = svg('system')
    // jsdom has no layout: the system's box is fed by hand like the heads'.
    g.getBoundingClientRect = () => rect(0, top, 400, 80)
    for (const note of heads) {
      const n = svg('note')
      n.id = note.id
      if (note.head !== false) {
        const head = svg('notehead')
        head.getBoundingClientRect = () => rect(note.x - 8.5, note.y - 7, 17, 14)
        n.append(head)
      }
      g.append(n)
    }
    return g
  }
  root.append(system(notes, 0), system(lower, 1000))
  return root
}

const all = () => true
const idAt = (root: HTMLElement, x: number, y: number, hasOnsets: (id: string) => boolean = all, tolerance?: number) =>
  findNoteAt(root, x, y, hasOnsets, tolerance)?.id ?? null

afterEach(() => vi.restoreAllMocks())

describe('findNoteAt', () => {
  it('has a tolerance of at least 12 px, about one notehead (17 px at 1440 px wide)', () => {
    expect(NOTE_TOLERANCE_PX).toBeGreaterThanOrEqual(12)
    expect(NOTE_TOLERANCE_PX).toBeLessThanOrEqual(20)
  })

  it('finds the note whose head is within the tolerance of the point, on any side', () => {
    const root = build([{ id: 'a', x: 100, y: 40 }])
    expect(idAt(root, 100, 40)).toBe('a')
    expect(idAt(root, 100 + 10, 40 + 6)).toBe('a')
    expect(idAt(root, 100 - NOTE_TOLERANCE_PX, 40)).toBe('a') // on the edge: inside
    expect(idAt(root, 100, 40 + NOTE_TOLERANCE_PX)).toBe('a')
  })

  it('finds nothing farther than the tolerance', () => {
    const root = build([{ id: 'a', x: 100, y: 40 }])
    expect(idAt(root, 100 + NOTE_TOLERANCE_PX + 1, 40)).toBeNull()
    expect(idAt(root, 100, 40 - NOTE_TOLERANCE_PX - 1)).toBeNull()
    expect(idAt(root, 12, 12)).toBeNull()
  })

  it('measures to the head, not to the box of the whole note', () => {
    // A stem 40 px tall above the head belongs to the note, but the point is measured from the head.
    const root = build([{ id: 'a', x: 100, y: 70 }])
    expect(idAt(root, 100, 30)).toBeNull()
    expect(idAt(root, 100, 60)).toBe('a')
  })

  it('takes the nearer of two notes', () => {
    const root = build([
      { id: 'a', x: 100, y: 40 },
      { id: 'b', x: 120, y: 40 },
    ])
    expect(idAt(root, 107, 40)).toBe('a')
    expect(idAt(root, 113, 40)).toBe('b')
  })

  it('takes the earlier note in the document when two heads are equally near (a chord)', () => {
    const root = build([
      { id: 'low', x: 100, y: 46 },
      { id: 'high', x: 100, y: 34 },
    ])
    expect(idAt(root, 100, 40)).toBe('low')
    expect(idAt(root, 100, 40)).toBe('low') // stable
    const reversed = build([
      { id: 'high', x: 100, y: 34 },
      { id: 'low', x: 100, y: 46 },
    ])
    expect(idAt(reversed, 100, 40)).toBe('high')
  })

  it('in a chord picks the head the point is nearer to', () => {
    const root = build([
      { id: 'low', x: 100, y: 46 },
      { id: 'high', x: 100, y: 34 },
    ])
    expect(idAt(root, 100, 37)).toBe('high')
    expect(idAt(root, 100, 44)).toBe('low')
  })

  it('skips a note with no onset and takes the next nearest in tolerance', () => {
    const root = build([
      { id: 'silent', x: 100, y: 40 },
      { id: 'b', x: 112, y: 40 },
    ])
    expect(idAt(root, 101, 40, (id) => id !== 'silent')).toBe('b')
    expect(idAt(root, 101, 40, (id) => id === 'silent')).toBe('silent')
    expect(idAt(root, 100, 40, (id) => id === 'nobody')).toBeNull()
  })

  it('skips a note that has no head element', () => {
    const root = build([
      { id: 'bare', x: 100, y: 40, head: false },
      { id: 'b', x: 112, y: 40 },
    ])
    expect(idAt(root, 100, 40)).toBe('b')
  })

  it('looks only at the systems near the point', () => {
    const root = build([{ id: 'a', x: 100, y: 40 }], [{ id: 'far', x: 100, y: 1040 }])
    const lowerHead = root.querySelector('#far g.notehead')!
    const spy = vi.spyOn(lowerHead, 'getBoundingClientRect')
    expect(idAt(root, 100, 40)).toBe('a')
    expect(spy).not.toHaveBeenCalled()
    expect(idAt(root, 100, 1040)).toBe('far')
  })

  it('works on a sheet without systems, over every note', () => {
    const root = document.createElement('div')
    const note = svg('note')
    note.id = 'a'
    const head = svg('notehead')
    head.getBoundingClientRect = () => rect(91.5, 33, 17, 14)
    note.append(head)
    root.append(note)
    expect(idAt(root, 100, 40)).toBe('a')
  })

  it('accepts another tolerance', () => {
    const root = build([{ id: 'a', x: 100, y: 40 }])
    expect(idAt(root, 130, 40, all, 30)).toBe('a')
    expect(idAt(root, 130, 40, all, 20)).toBeNull()
  })
})
