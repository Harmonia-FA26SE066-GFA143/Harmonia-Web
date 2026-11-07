import { describe, expect, it } from 'vitest'
import { parseTimemap } from './parseTimemap'
import type { AliasMap, RawTimemapEntry, TieMap } from './types'

// Tie E (1333-2000) -> E (2000-2667), as in the spike fixture (docs/local/spikes/verovio/fixtures).
const tieEntries: RawTimemapEntry[] = [
  { tstamp: 0, on: ['c1'] },
  { tstamp: 667, off: ['c1'], on: ['d1'] },
  { tstamp: 1333, off: ['d1'], on: ['e1'] },
  { tstamp: 2000, off: ['e1'], on: ['e2'] },
  { tstamp: 2667, off: ['e2'] },
]

const tieMap: TieMap = new Map([
  ['e1', { tieGroupId: 'e1', isTieContinuation: false, members: ['e1', 'e2'] }],
  ['e2', { tieGroupId: 'e1', isTieContinuation: true, members: ['e1', 'e2'] }],
])

describe('parseTimemap', () => {
  it('converts ms to seconds', () => {
    const { events } = parseTimemap([{ tstamp: 1500, on: ['n1'] }])

    expect(events[0].time).toBe(1.5)
  })

  it('keeps chord notes as separate on events at same time', () => {
    const { events } = parseTimemap([{ tstamp: 1000, on: ['a', 'b'] }, { tstamp: 2000, off: ['a', 'b'] }])

    const ons = events.filter((e) => e.type === 'on')
    expect(ons.map((e) => [e.noteId, e.time])).toEqual([
      ['a', 1],
      ['b', 1],
    ])
  })

  it('orders off before on at equal time', () => {
    const { events } = parseTimemap([{ tstamp: 0, on: ['a'] }, { tstamp: 1000, off: ['a'], on: ['b'] }, { tstamp: 2000, off: ['b'] }])

    const atOne = events.filter((e) => e.time === 1)
    expect(atOne.map((e) => [e.type, e.noteId])).toEqual([
      ['off', 'a'],
      ['on', 'b'],
    ])
  })

  it('collects every onset for repeated ids', () => {
    const { onsets } = parseTimemap([
      { tstamp: 1000, on: ['n1'] },
      { tstamp: 2000, off: ['n1'] },
      { tstamp: 5000, on: ['n1'] },
      { tstamp: 6000, off: ['n1'] },
    ])

    expect(onsets.get('n1')).toEqual([1, 5])
  })

  it('ignores entries without on/off', () => {
    const { events } = parseTimemap([{ tstamp: 0, on: ['a'] }, { tstamp: 500 }, { tstamp: 1000, off: ['a'] }])

    expect(events.map((e) => [e.type, e.time])).toEqual([
      ['on', 0],
      ['off', 1],
    ])
  })

  it('uses the last tstamp as duration in seconds', () => {
    const { duration } = parseTimemap([{ tstamp: 0, on: ['a'] }, { tstamp: 4250, off: ['a'] }])

    expect(duration).toBe(4.25)
  })

  it('does not add events for a trailing entry without on/off', () => {
    const { events, duration } = parseTimemap([{ tstamp: 0, on: ['a'] }, { tstamp: 1000, off: ['a'] }, { tstamp: 4250 }])

    expect(events.map((e) => [e.type, e.time])).toEqual([
      ['on', 0],
      ['off', 1],
    ])
    expect(duration).toBe(4.25)
  })

  it('returns empty timeline for empty input', () => {
    const timeline = parseTimemap([])

    expect(timeline.events).toEqual([])
    expect(timeline.onsets.size).toBe(0)
    expect(timeline.duration).toBe(0)
  })

  it('maps alias ids to canonical via AliasMap', () => {
    // Alias deliberately has no `-rend` suffix: the parser must look it up, never cut strings.
    const aliases: AliasMap = new Map([['x9', 'x1']])
    const { events, onsets } = parseTimemap(
      [
        { tstamp: 1000, on: ['x1'] },
        { tstamp: 2000, off: ['x1'] },
        { tstamp: 5000, on: ['x9'] },
        { tstamp: 6000, off: ['x9'] },
      ],
      aliases,
    )

    expect(onsets.get('x1')).toEqual([1, 5])
    expect(onsets.has('x9')).toBe(false)
    const repeated = events.find((e) => e.time === 5 && e.type === 'on')
    expect(repeated).toMatchObject({ noteId: 'x1', elementId: 'x9' })
  })

  it('maps unknown ids to themselves', () => {
    const aliases: AliasMap = new Map([['x9', 'x1']])
    const { events } = parseTimemap([{ tstamp: 0, on: ['q-rend2'] }, { tstamp: 1000, off: ['q-rend2'] }], aliases)

    expect(events[0]).toMatchObject({ noteId: 'q-rend2', elementId: 'q-rend2' })
  })

  it('keeps separate on/off events per tied notehead', () => {
    const { events } = parseTimemap(tieEntries, undefined, tieMap)

    const e1 = events.filter((e) => e.noteId === 'e1').map((e) => [e.type, e.time])
    const e2 = events.filter((e) => e.noteId === 'e2').map((e) => [e.type, e.time])
    expect(e1).toEqual([
      ['on', 1.333],
      ['off', 2],
    ])
    expect(e2).toEqual([
      ['on', 2],
      ['off', 2.667],
    ])
  })

  it('finalOff of a tie group equals the last notehead off', () => {
    const { events } = parseTimemap(tieEntries, undefined, tieMap)

    for (const noteId of ['e1', 'e2']) {
      const e = events.filter((x) => x.noteId === noteId)
      expect(e.map((x) => x.finalOff)).toEqual([2.667, 2.667])
    }
    expect(events.find((e) => e.noteId === 'e1' && e.type === 'on')).toMatchObject({ tieGroupId: 'e1', isTieContinuation: false })
    expect(events.find((e) => e.noteId === 'e2' && e.type === 'on')).toMatchObject({ tieGroupId: 'e1', isTieContinuation: true })
  })

  it('sets finalOff to its own off for a note without tie', () => {
    const { events } = parseTimemap(tieEntries, undefined, tieMap)

    const c = events.filter((e) => e.noteId === 'c1')
    expect(c.map((e) => e.finalOff)).toEqual([0.667, 0.667])
    expect(c[0].tieGroupId).toBeUndefined()
    expect(c[0].isTieContinuation).toBe(false)
  })

  it('finalOff pairs the nth occurrence of head with the nth occurrence of continuation', () => {
    // Repeat plays the tie again with a longer continuation (8 s vs 3 s) so a wrong pairing is visible.
    const aliases: AliasMap = new Map([
      ['e1-rend2', 'e1'],
      ['e2-rend2', 'e2'],
    ])
    const { events } = parseTimemap(
      [
        { tstamp: 1000, on: ['e1'] },
        { tstamp: 2000, off: ['e1'], on: ['e2'] },
        { tstamp: 3000, off: ['e2'] },
        { tstamp: 5000, on: ['e1-rend2'] },
        { tstamp: 6000, off: ['e1-rend2'], on: ['e2-rend2'] },
        { tstamp: 8000, off: ['e2-rend2'] },
      ],
      aliases,
      tieMap,
    )

    const headOns = events.filter((e) => e.noteId === 'e1' && e.type === 'on')
    const contOns = events.filter((e) => e.noteId === 'e2' && e.type === 'on')
    expect(headOns.map((e) => [e.time, e.finalOff])).toEqual([
      [1, 3],
      [5, 8],
    ])
    expect(contOns.map((e) => [e.time, e.finalOff])).toEqual([
      [2, 3],
      [6, 8],
    ])
  })

  it('alias map and tie map are independent', () => {
    const aliases: AliasMap = new Map([['e9', 'e1']])
    const entries: RawTimemapEntry[] = [
      { tstamp: 0, on: ['e9'] },
      { tstamp: 1000, off: ['e9'] },
    ]

    const aliasOnly = parseTimemap(entries, aliases)
    expect(aliasOnly.events[0]).toMatchObject({ noteId: 'e1', isTieContinuation: false })
    expect(aliasOnly.events[0].tieGroupId).toBeUndefined()

    const both = parseTimemap(entries, aliases, tieMap)
    expect(both.events[0]).toMatchObject({ noteId: 'e1', tieGroupId: 'e1', isTieContinuation: false })

    const tieOnly = parseTimemap(entries, undefined, tieMap)
    expect(tieOnly.events[0]).toMatchObject({ noteId: 'e9', isTieContinuation: false })
    expect(tieOnly.events[0].tieGroupId).toBeUndefined()
  })

  it('onsets include continuation onset', () => {
    const { onsets } = parseTimemap(tieEntries, undefined, tieMap)

    expect(onsets.get('e1')).toEqual([1.333])
    expect(onsets.get('e2')).toEqual([2])
  })
})
