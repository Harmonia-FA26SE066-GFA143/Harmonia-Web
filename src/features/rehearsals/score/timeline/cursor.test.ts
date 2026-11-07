import { describe, expect, it } from 'vitest'
import { createTimelineCursor } from './cursor'
import type { PlaybackTimeline, TimelineEvent } from './types'

type Spec = [time: number, type: 'on' | 'off', noteId: string]

/** Builds a timeline from [time, type, noteId] triples; sorted like parseTimemap (off before on at equal time). */
function timeline(specs: Spec[]): PlaybackTimeline {
  const events: TimelineEvent[] = specs
    .map(([time, type, noteId], order) => ({ order, event: { time, type, noteId, elementId: noteId, isTieContinuation: false, finalOff: time } }))
    .sort((a, b) => a.event.time - b.event.time || (a.event.type === 'off' ? 0 : 1) - (b.event.type === 'off' ? 0 : 1) || a.order - b.order)
    .map((item) => item.event)
  return { events, onsets: new Map(), duration: events.at(-1)?.time ?? 0 }
}

const sorted = (ids: Iterable<string>) => [...ids].sort()

describe('createTimelineCursor', () => {
  it('adds notes whose on <= time and removes after off', () => {
    const cursor = createTimelineCursor(timeline([[1, 'on', 'a'], [2, 'off', 'a'], [2, 'on', 'b'], [3, 'off', 'b']]))
    expect(cursor.advance(0.5)).toEqual({ added: [], removed: [] })
    expect(cursor.advance(1)).toEqual({ added: ['a'], removed: [] })
    expect(cursor.advance(2.5)).toEqual({ added: ['b'], removed: ['a'] })
    expect(cursor.advance(3)).toEqual({ added: [], removed: ['b'] })
    expect(cursor.active().size).toBe(0)
  })

  it('chord lights all notes together', () => {
    const cursor = createTimelineCursor(timeline([[1, 'on', 'a'], [1, 'on', 'b'], [1, 'on', 'c'], [2, 'off', 'a'], [2, 'off', 'b'], [2, 'off', 'c']]))
    expect(sorted(cursor.advance(1).added)).toEqual(['a', 'b', 'c'])
    expect(sorted(cursor.active())).toEqual(['a', 'b', 'c'])
  })

  it('tie boundary swaps highlight in one diff', () => {
    const cursor = createTimelineCursor(timeline([[1, 'on', 'head'], [2, 'off', 'head'], [2, 'on', 'cont'], [3, 'off', 'cont']]))
    cursor.advance(1.9)
    expect(cursor.advance(2)).toEqual({ added: ['cont'], removed: ['head'] })
  })

  it('overlapping occurrences of the same canonical id are reference-counted', () => {
    const cursor = createTimelineCursor(timeline([[1, 'on', 'a'], [2, 'on', 'a'], [3, 'off', 'a'], [4, 'off', 'a']]))
    cursor.advance(2)
    expect(cursor.advance(3.5)).toEqual({ added: [], removed: [] })
    expect(cursor.active().has('a')).toBe(true)
    expect(cursor.advance(4)).toEqual({ added: [], removed: ['a'] })
  })

  it('tied note stays active across next onset', () => {
    const cursor = createTimelineCursor(timeline([[1, 'on', 'a'], [2, 'on', 'b'], [3, 'off', 'a'], [3, 'off', 'b']]))
    cursor.advance(2.5)
    expect(sorted(cursor.active())).toEqual(['a', 'b'])
  })

  it('seek backward rebuilds active set', () => {
    const cursor = createTimelineCursor(timeline([[1, 'on', 'a'], [3, 'off', 'a'], [5, 'on', 'b'], [8, 'off', 'b'], [9, 'on', 'c'], [12, 'off', 'c']]))
    cursor.advance(10)
    expect(sorted(cursor.active())).toEqual(['c'])
    expect(cursor.advance(2)).toEqual({ added: ['a'], removed: ['c'] })
    expect(sorted(cursor.active())).toEqual(['a'])
  })

  it('seek forward over many events yields correct set', () => {
    const specs: Spec[] = []
    for (let i = 0; i < 30; i++) specs.push([i, 'on', `n${i}`], [i + 1, 'off', `n${i}`])
    specs.push([29.5, 'on', 'held'])
    const cursor = createTimelineCursor(timeline(specs))
    const diff = cursor.advance(30)
    expect(diff.removed).toEqual([])
    expect(sorted(diff.added)).toEqual(['held'])
    expect(sorted(cursor.active())).toEqual(['held'])
  })

  it('same time twice returns empty diff', () => {
    const cursor = createTimelineCursor(timeline([[1, 'on', 'a']]))
    cursor.advance(1)
    expect(cursor.advance(1)).toEqual({ added: [], removed: [] })
  })

  it('empty timeline never throws', () => {
    const cursor = createTimelineCursor({ events: [], onsets: new Map(), duration: 0 })
    expect(cursor.advance(5)).toEqual({ added: [], removed: [] })
    expect(cursor.advance(-1)).toEqual({ added: [], removed: [] })
    cursor.reset()
    expect(cursor.active().size).toBe(0)
  })

  it('reset clears state so the next advance re-adds active notes', () => {
    const cursor = createTimelineCursor(timeline([[1, 'on', 'a'], [5, 'off', 'a']]))
    cursor.advance(2)
    cursor.reset()
    expect(cursor.active().size).toBe(0)
    expect(cursor.advance(2)).toEqual({ added: ['a'], removed: [] })
  })

  it('ignores an off with no matching on instead of going negative', () => {
    const cursor = createTimelineCursor(timeline([[1, 'off', 'a'], [2, 'on', 'a'], [3, 'off', 'a']]))
    cursor.advance(1.5)
    expect(cursor.advance(2).added).toEqual(['a'])
    expect(cursor.advance(3).removed).toEqual(['a'])
  })

  it('20 000 events: incremental and far seeks match a hand-computed set', () => {
    // note i sounds on [i, i + 2.5): at time t (not on a boundary) active = ids with i <= t < i + 2.5
    const specs: Spec[] = []
    for (let i = 0; i < 10_000; i++) specs.push([i, 'on', `n${i}`], [i + 2.5, 'off', `n${i}`])
    const expected = (t: number) => {
      const ids: string[] = []
      for (let i = Math.max(0, Math.floor(t - 2.5) - 1); i <= Math.floor(t); i++) if (i <= t && t < i + 2.5) ids.push(`n${i}`)
      return sorted(ids)
    }
    const stepped = createTimelineCursor(timeline(specs))
    for (let t = 0.25; t < 10_000; t += 997.5) stepped.advance(t)
    const jumper = createTimelineCursor(timeline(specs))
    for (const t of [9_000.25, 40.25, 7_500.75, 0.25, 9_999.25]) {
      jumper.advance(t)
      expect(sorted(jumper.active())).toEqual(expected(t))
    }
    const smooth = createTimelineCursor(timeline(specs))
    for (let t = 0.25; t <= 500.25; t += 1) smooth.advance(t)
    expect(sorted(smooth.active())).toEqual(expected(500.25))
  })
})
