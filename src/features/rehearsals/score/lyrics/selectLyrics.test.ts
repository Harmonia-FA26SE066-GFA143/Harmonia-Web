import { describe, expect, it } from 'vitest'
import { createTimelineCursor } from '../timeline/cursor'
import { parseTieMap } from '../timeline/tieMap'
import { parseTimemap } from '../timeline/parseTimemap'
import type { RawTimemapEntry } from '../timeline/types'
import { lyricSpans, parseLyrics } from './parseLyrics'
import {
  activeSyllables,
  assignParts,
  createActiveSyllableIndex,
  listVerses,
  melismaSpans,
  parseMelismas,
  resolveParts,
  selectLyrics,
} from './selectLyrics'
import type { LyricSpan, LyricSyllable } from './types'

const doc = (scoreDef: string, staves = '') =>
  `<?xml version="1.0" encoding="UTF-8"?><mei xmlns="http://www.music-encoding.org/ns/mei"><music><body><mdiv><score><scoreDef>${scoreDef}</scoreDef><section><measure>${staves}</measure></section></score></mdiv></body></music></mei>`
const staff = (n: string, body: string) => `<staff n="${n}"><layer n="1">${body}</layer></staff>`
const note = (id: string, verse = '1', syl = id, con = '') =>
  `<note xml:id="${id}"><verse n="${verse}"><syl xml:id="${id}-s"${con ? ` con="${con}"` : ''}>${syl}</syl></verse></note>`
const bare = (id: string) => `<note xml:id="${id}"/>`
const rest = '<rest/>'

/** One note per second, in the given order. */
const sequential = (ids: readonly string[]) => [
  ...ids.map((id, i) => ({ tstamp: i * 1000, on: [id], ...(i > 0 ? { off: [ids[i - 1]] } : {}) })),
  { tstamp: ids.length * 1000, off: [ids[ids.length - 1]] },
]
/** [id, on, off] in seconds -> raw timemap. */
const timed = (notes: readonly (readonly [string, number, number])[]): RawTimemapEntry[] => {
  const entries = new Map<number, { tstamp: number; on: string[]; off: string[] }>()
  const entry = (time: number) => entries.get(time) ?? entries.set(time, { tstamp: time * 1000, on: [], off: [] }).get(time)!
  for (const [id, on, off] of notes) {
    entry(on).on.push(id)
    entry(off).off.push(id)
  }
  return [...entries.values()].sort((a, b) => a.tstamp - b.tstamp)
}
const timesOf = (spans: readonly LyricSpan[]) => spans.map(({ syllable, start, end }) => [syllable.text, start, end])
const held = (mei: string, timemap: readonly RawTimemapEntry[]) =>
  melismaSpans(parseLyrics(mei), parseTimemap(timemap, undefined, parseTieMap(mei)), parseMelismas(mei))

const entries = (mei: string) => [...resolveParts(mei)].map(([n, { partKey, label }]) => [n, partKey, label])

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value)) deepFreeze(child)
  }
  return value
}

describe('resolveParts', () => {
  const labelled = (first: string, second: string) =>
    doc(`<staffGrp><staffDef n="1"><label>${first}</label></staffDef><staffDef n="2"><label>${second}</label></staffDef></staffGrp>`)

  it.each([
    ['keys each staff of a reduced SATB (two labelled staves) by the slug of its label', labelled('S.A.', 'T.B.'), ['s-a', 'S.A.'], ['t-b', 'T.B.']],
    ['strips Vietnamese diacritics from the key but keeps them in the display label', labelled(' Nữ cao ', 'Đồng ca'), ['nu-cao', 'Nữ cao'], ['dong-ca', 'Đồng ca']],
    [
      'numbers the staves of one part whose label sits on the staffGrp (Verovio: one MusicXML part, two staves)',
      doc('<staffGrp><staffGrp><label>Hợp xướng</label><staffDef n="1"/><staffDef n="2"/></staffGrp></staffGrp>'),
      ['hop-xuong-1', 'Hợp xướng 1'],
      ['hop-xuong-2', 'Hợp xướng 2'],
    ],
  ])('%s', (_name, mei, [key1, label1], [key2, label2]) => {
    expect(entries(mei)).toEqual([
      ['1', key1, label1],
      ['2', key2, label2],
    ])
  })

  it('prefers the label of the staffDef over the label of its group', () => {
    const mei = doc('<staffGrp><label>Ca đoàn</label><staffDef n="1"><label>Nữ</label></staffDef></staffGrp>')

    expect(entries(mei)).toEqual([['1', 'nu', 'Nữ']])
  })

  it('falls back to document order, not staff@n, when labels are missing', () => {
    const mei = doc('<staffGrp><staffDef n="2"/><staffDef n="1"/></staffGrp>')

    expect(entries(mei)).toEqual([
      ['2', 'be-1', 'Bè 1'],
      ['1', 'be-2', 'Bè 2'],
    ])
  })

  it('uses the order key for a label with nothing to slug, and keeps that label for display', () => {
    expect(entries(doc('<staffGrp><staffDef n="1"><label>♪</label></staffDef></staffGrp>'))).toEqual([['1', 'be-1', '♪']])
  })

  it('never hands out the same partKey twice', () => {
    const mei = doc('<staffGrp><staffDef n="1"/><staffDef n="2"><label>be 1</label></staffDef></staffGrp>')

    expect(new Set([...resolveParts(mei).values()].map((part) => part.partKey)).size).toBe(2)
  })

  it('keeps the first staffDef of a staff when a later scoreDef repeats it', () => {
    const mei = doc('<staffGrp><staffDef n="1"><label>Nữ</label></staffDef><staffDef n="1"><label>Khác</label></staffDef></staffGrp>')

    expect(entries(mei)).toEqual([['1', 'nu', 'Nữ']])
  })

  it('skips a staffDef without n, and returns nothing for broken MEI (same convention as parseLyrics)', () => {
    expect(entries(doc('<staffGrp><staffDef/></staffGrp>'))).toEqual([])
    for (const broken of ['<mei><staffDef n="1">', '', 'not xml']) expect(resolveParts(broken).size).toBe(0)
  })
})

describe('selectLyrics and listVerses', () => {
  const satb = doc(
    '<staffGrp><staffDef n="1"><label>Nữ</label></staffDef><staffDef n="2"><label>Nam</label></staffDef></staffGrp>',
    staff('1', note('a', '2', 'a2') + note('b', '1', 'b1') + note('c', 'A', 'cA') + note('d', '0', 'd0') + note('e', '2', 'e2')) +
      staff('2', note('x', '1', 'x1') + note('y', 'B', 'yB')),
  )
  const syllables = assignParts(parseLyrics(satb), resolveParts(satb))

  it('tags every syllable with its partKey without changing the P1 fields', () => {
    expect(syllables[0]).toEqual({ ...parseLyrics(satb)[0], partKey: 'nu' })
  })

  it('selects by part and verse', () => {
    expect(selectLyrics(syllables, { partKey: 'nam', verse: '1' }).map((s) => s.text)).toEqual(['x1'])
    expect(selectLyrics(syllables, { partKey: 'nu', verse: '2' }).map((s) => s.text)).toEqual(['a2', 'e2'])
  })

  it('compares verse as a string: "A" and "0" are real verses, "0" is not "1"', () => {
    expect(selectLyrics(syllables, { partKey: 'nu', verse: 'A' }).map((s) => s.text)).toEqual(['cA'])
    expect(selectLyrics(syllables, { partKey: 'nu', verse: '0' }).map((s) => s.text)).toEqual(['d0'])
  })

  it('returns nothing for an unknown part or a verse only another part has', () => {
    expect(selectLyrics(syllables, { partKey: 'khong-co', verse: '1' })).toEqual([])
    expect(selectLyrics(syllables, { partKey: 'nu', verse: 'B' })).toEqual([])
  })

  it('lists the verses of one part in order of first appearance, unsorted and without repeats', () => {
    expect(listVerses(syllables, 'nu')).toEqual(['2', '1', 'A', '0'])
    expect(listVerses(syllables, 'nam')).toEqual(['1', 'B'])
    expect(listVerses(syllables, 'khong-co')).toEqual([])
  })

  it('drops a syllable whose staff has no staffDef, it belongs to no part', () => {
    const lone: LyricSyllable = { syllableId: 's', noteId: 'n', verse: '1', staff: '9', text: 't' }
    const noStaff: LyricSyllable = { syllableId: 'u', noteId: 'n', verse: '1', text: 't' }

    expect(assignParts([lone, noStaff], resolveParts(satb))).toEqual([])
  })

  it('handles empty input', () => {
    expect(assignParts([], resolveParts(satb))).toEqual([])
    expect(selectLyrics([], { partKey: 'nu', verse: '1' })).toEqual([])
    expect(listVerses([], 'nu')).toEqual([])
  })
})

describe('melismaSpans', () => {
  it('holds con="u" over consecutive lyric-less notes and stops at the next syllable of the verse', () => {
    const mei = doc('', staff('1', note('a', '1', 'A', 'u') + bare('b') + bare('c') + note('d', '1', 'D') + bare('e')))

    expect(timesOf(held(mei, sequential(['a', 'b', 'c', 'd', 'e'])))).toEqual([
      ['A', 0, 3],
      ['D', 3, 4],
    ])
  })

  it('ends at the last melisma note before a rest, and stays dark through the rest and the interlude', () => {
    const mei = doc('', staff('1', note('a', '1', 'A', 'u') + bare('b') + rest + bare('i') + note('d', '1', 'D')))
    const spans = held(mei, timed([['a', 0, 1], ['b', 1, 2], ['i', 4, 6], ['d', 6, 7]]))

    expect(timesOf(spans)).toEqual([
      ['A', 0, 2],
      ['D', 6, 7],
    ])
    expect(activeSyllables(spans, { time: 3 })).toEqual([])
  })

  it('stops when the next note does not start as the previous one ends (a gap without a rest element)', () => {
    const mei = doc('', staff('1', note('a', '1', 'A', 'u') + bare('b')))

    expect(timesOf(held(mei, timed([['a', 0, 1], ['b', 3, 4]])))).toEqual([['A', 0, 1]])
  })

  it('does not extend con="d" or a syllable without con', () => {
    const mei = doc('', staff('1', note('a', '1', 'A', 'd') + bare('b') + note('c', '1', 'C') + bare('d') + note('e', '1', 'E')))

    expect(timesOf(held(mei, sequential(['a', 'b', 'c', 'd', 'e'])))).toEqual([
      ['A', 0, 1],
      ['C', 2, 3],
      ['E', 4, 5],
    ])
  })

  it('keeps going over a note that only carries another verse, and ignores other staves and layers', () => {
    const mei = doc(
      '',
      `<staff n="1"><layer n="1">${note('a', '1', 'A1', 'u') + note('b', '2', 'B2') + bare('c') + note('d', '1', 'D1')}</layer>` +
        `<layer n="2">${note('y', '1', 'Y')}</layer></staff>${staff('2', note('x', '1', 'X'))}`,
    )
    const spans = held(mei, timed([['a', 0, 1], ['b', 1, 2], ['x', 1, 2], ['y', 1, 2], ['c', 2, 3], ['d', 3, 4]]))

    expect(timesOf(spans).find(([text]) => text === 'A1')).toEqual(['A1', 0, 3])
  })

  it('ends a final con="u" with its last note, not at the end of a lyric-less coda', () => {
    const mei = doc('', staff('1', note('a', '1', 'A') + note('b', '1', 'B', 'u') + bare('c') + rest + bare('k1') + bare('k2')))
    const spans = held(mei, timed([['a', 0, 1], ['b', 1, 6], ['c', 6, 12], ['k1', 14, 22], ['k2', 22, 30]]))

    expect(timesOf(spans)).toEqual([
      ['A', 0, 1],
      ['B', 1, 12],
    ])
    expect(activeSyllables(spans, { time: 20 })).toEqual([])
  })

  it('ends a final con="u" at the end of its layer when no rest follows', () => {
    const mei = doc('', staff('1', note('b', '1', 'B', 'u') + bare('c')) + staff('2', bare('p')))

    expect(timesOf(held(mei, timed([['b', 0, 1], ['c', 1, 2], ['p', 0, 30]])))).toEqual([['B', 0, 2]])
  })

  it('falls back to the syllable own span when the continuation is unknown', () => {
    const mei = doc('', staff('1', note('a', '1', 'A', 'u') + '<note/>' + bare('c')))
    const timeline = parseTimemap(sequential(['a', 'c']))

    expect(timesOf(melismaSpans(parseLyrics(mei), timeline, parseMelismas(mei)))).toEqual([['A', 0, 1]])
    expect(timesOf(melismaSpans(parseLyrics(mei), timeline, new Map()))).toEqual([['A', 0, 1]])
  })

  it('does not hold the first of two syls on one note past the second, even when both are con="u"', () => {
    const one = doc('', staff('1', '<note xml:id="a"><verse n="1"><syl con="u">x</syl><syl>y</syl></verse></note>' + bare('b')))
    const both = doc('', staff('1', '<note xml:id="a"><verse n="1"><syl con="u">x</syl><syl con="u">y</syl></verse></note>' + bare('b')))

    expect(timesOf(held(one, sequential(['a', 'b'])))).toEqual([
      ['x', 0, 1],
      ['y', 0, 1],
    ])
    expect(timesOf(held(both, sequential(['a', 'b'])))).toEqual([
      ['x', 0, 1],
      ['y', 0, 2],
    ])
  })

  it('only ever extends: a long note holding past its next syllable keeps its own end', () => {
    const mei = doc('', `<staff n="1"><layer n="1">${note('a', '1', 'A', 'u')}</layer><layer n="2">${note('b', '1', 'B')}</layer></staff>`)

    expect(timesOf(held(mei, timed([['a', 0, 5], ['b', 1, 2]])))[0]).toEqual(['A', 0, 5])
  })

  it('extends each occurrence of a repeat on its own pass', () => {
    const mei = doc('', staff('1', note('a', '1', 'A', 'u') + bare('b') + note('c', '1', 'C')))

    expect(timesOf(held(mei, sequential(['a', 'b', 'c', 'a', 'b', 'c'])))).toEqual([
      ['A', 0, 2],
      ['C', 2, 3],
      ['A', 3, 5],
      ['C', 5, 6],
    ])
  })

  it('follows a repeat expanded with alias ids (a-rend2 -> a) through AliasMap and lyricSpans', () => {
    const mei = doc('', staff('1', note('a', '1', 'A', 'u') + bare('b') + note('c', '1', 'C')))
    const aliases = new Map([
      ['a-rend2', 'a'],
      ['b-rend2', 'b'],
      ['c-rend2', 'c'],
    ])
    const timeline = parseTimemap(sequential(['a', 'b', 'c', 'a-rend2', 'b-rend2', 'c-rend2']), aliases, parseTieMap(mei))

    expect(timesOf(melismaSpans(parseLyrics(mei), timeline, parseMelismas(mei)))).toEqual([
      ['A', 0, 2],
      ['C', 2, 3],
      ['A', 3, 5],
      ['C', 5, 6],
    ])
  })

  // Known limit (P2, fix in Track A / P10): successors follow document order, so a melisma whose next played note is not
  // its next written note is cut at the end of its own note. These tests lock that safe failure, not the final behaviour.
  const sections = (measures: string) =>
    `<?xml version="1.0" encoding="UTF-8"?><mei xmlns="http://www.music-encoding.org/ns/mei"><music><body><mdiv><score><scoreDef/><section>${measures}</section></score></mdiv></body></music></mei>`

  it('known limit, cut early: a melisma into a volta holds over ending 1 on pass 1 but stops at its own note on pass 2', () => {
    const mei = sections(
      `<measure>${staff('1', note('a', '1', 'A', 'u'))}</measure>` +
        `<ending n="1"><measure>${staff('1', bare('b1'))}</measure></ending>` +
        `<ending n="2"><measure>${staff('1', bare('b2'))}</measure></ending>` +
        `<measure>${staff('1', note('c', '1', 'C'))}</measure>`,
    )
    const timeline = parseTimemap(sequential(['a', 'b1', 'a-rend2', 'b2', 'c']), new Map([['a-rend2', 'a']]), parseTieMap(mei))
    const spans = melismaSpans(parseLyrics(mei), timeline, parseMelismas(mei))

    expect(timesOf(spans)).toEqual([
      ['A', 0, 2],
      ['A', 2, 3],
      ['C', 4, 5],
    ])
    expect(activeSyllables(spans, { time: 3.5 })).toEqual([])
  })

  it('known limit, cut early: a melisma over the backward jump of a repeat stops at its own note', () => {
    const mei = sections(`<measure>${staff('1', bare('b') + note('a', '1', 'A', 'u'))}</measure><measure>${staff('1', note('d', '1', 'D'))}</measure>`)
    const aliases = new Map([
      ['b-rend2', 'b'],
      ['a-rend2', 'a'],
    ])
    const timeline = parseTimemap(sequential(['b', 'a', 'b-rend2', 'a-rend2', 'd']), aliases, parseTieMap(mei))
    const spans = melismaSpans(parseLyrics(mei), timeline, parseMelismas(mei))

    expect(timesOf(spans)).toEqual([
      ['A', 1, 2],
      ['A', 3, 4],
      ['D', 4, 5],
    ])
    expect(activeSyllables(spans, { time: 2.5 })).toEqual([])
  })

  it('holds across a tie group, and leaves the P1 lyricSpans contract as it was', () => {
    const mei = doc('', `${staff('1', note('a', '1', 'A', 'u') + bare('b') + bare('c') + note('d', '1', 'D'))}<tie startid="#a" endid="#b"/>`)
    const timeline = parseTimemap(sequential(['a', 'b', 'c', 'd']), undefined, parseTieMap(mei))

    expect(timesOf(melismaSpans(parseLyrics(mei), timeline, parseMelismas(mei)))[0]).toEqual(['A', 0, 3])
    expect(timesOf(lyricSpans(parseLyrics(mei), timeline))[0]).toEqual(['A', 0, 2])
  })

  it('handles empty input and never mutates its input', () => {
    const mei = doc('', staff('1', note('a', '1', 'A', 'u') + bare('b')))
    const syllables = deepFreeze(parseLyrics(mei))
    const timeline = deepFreeze(parseTimemap(sequential(['a', 'b'])))

    expect(melismaSpans([], timeline, parseMelismas(mei))).toEqual([])
    expect(timesOf(melismaSpans(syllables, timeline, parseMelismas(mei)))).toEqual([['A', 0, 2]])
    expect(parseMelismas('not xml').size).toBe(0)
  })
})

/** The pre-index implementation, kept as the reference the index must match exactly. */
const scanAll = (spans: readonly LyricSpan[], time: number) => [
  ...new Set(spans.filter((span) => span.start <= time && time < span.end).map((span) => span.syllable.syllableId)),
]
/** mulberry32: small seeded PRNG so a failure reproduces. */
const seeded = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

describe('activeSyllables and createActiveSyllableIndex', () => {
  const syllable = (syllableId: string): LyricSyllable => ({ syllableId, noteId: syllableId, verse: '1', text: syllableId })
  const span = (syllableId: string, start: number, end: number): LyricSpan => ({ syllable: syllable(syllableId), start, end })
  const spans = [span('a', 0, 1), span('b', 1, 2), span('c', 3, 4)]
  const at = (time: number, list: readonly LyricSpan[] = spans) => activeSyllables(list, { time })

  it('returns the syllable whose span contains the time', () => {
    expect(at(0.5)).toEqual(['a'])
  })

  it('treats a span as [start, end): lit at start, already off at end', () => {
    expect(at(0)).toEqual(['a'])
    expect(at(1)).toEqual(['b'])
    expect(at(2)).toEqual([])
    expect(at(4)).toEqual([])
  })

  it('agrees with createTimelineCursor on every boundary', () => {
    const mei = doc('', staff('1', note('a') + note('b') + note('c')))
    const timeline = parseTimemap(sequential(['a', 'b', 'c']))
    const lyricTimes = lyricSpans(parseLyrics(mei), timeline)
    const cursor = createTimelineCursor(timeline)

    for (const time of [0, 1, 2, 3]) {
      cursor.advance(time)
      expect(at(time, lyricTimes)).toEqual([...cursor.active()].map((id) => `${id}-s`))
    }
  })

  it('is empty in a gap between spans, before the first and after the last', () => {
    expect(at(2.5)).toEqual([])
    expect(at(-1)).toEqual([])
    expect(at(99)).toEqual([])
  })

  it('depends only on the time, so a backward or forward seek needs no reset', () => {
    expect(at(3.5)).toEqual(['c'])
    expect(at(0.5)).toEqual(['a'])
    expect(at(1.5)).toEqual(['b'])
    expect(at(3.5)).toEqual(['c'])
  })

  it('returns one id per selected part sounding at that time', () => {
    expect(at(0.5, [span('nu', 0, 1), span('nam', 0, 2), span('khac', 5, 6)])).toEqual(['nu', 'nam'])
  })

  // Contract (JSDoc of activeSyllables): spans are an immutable snapshot; mutating the same array is unsupported and has
  // no test on purpose. A new array, same content or not, is read afresh.
  it('reads a new spans array as a new snapshot, whether its content is the same or grew', () => {
    const first = [span('a', 0, 2)]

    expect(at(1, first)).toEqual(['a'])
    expect(at(1, [...first])).toEqual(['a'])
    expect(at(1, [...first, span('b', 1, 3)])).toEqual(['a', 'b'])
    expect(at(1, first)).toEqual(['a'])
  })

  it('returns an id once when two occurrences of a syllable overlap', () => {
    expect(at(1.5, [span('a', 0, 2), span('a', 1, 3)])).toEqual(['a'])
  })

  it('keeps a melisma lit through its lyric-less notes', () => {
    const mei = doc('', staff('1', note('a', '1', 'A', 'u') + bare('b') + note('c', '1', 'C')))
    const lit = held(mei, sequential(['a', 'b', 'c']))

    expect(at(1.5, lit)).toEqual(['a-s'])
    expect(at(2, lit)).toEqual(['c-s'])
  })

  it('matches a full scan exactly on seeded random spans, for forward, backward and random seeks and exact boundaries', () => {
    for (const seed of [1, 7, 2026]) {
      const random = seeded(seed)
      const pick = (n: number) => Math.floor(random() * n)
      // Half-second grid so many spans share boundaries; lengths include 0 and negative; ids repeat.
      const list = Array.from({ length: 300 }, () => {
        const start = pick(200) / 2
        return span(`s${pick(40)}`, start, start + (pick(9) - 2) / 2)
      })
      const index = createActiveSyllableIndex(list)
      const bounds = list.flatMap((s) => [s.start, s.end])
      const forward = Array.from({ length: 220 }, (_, i) => i / 2 - 5)
      const times = [
        ...forward,
        ...[...forward].reverse(),
        ...bounds,
        ...bounds.map((b) => b - 1e-9),
        ...Array.from({ length: 500 }, () => random() * 120 - 10),
        Number.NaN,
        -Infinity,
        Infinity,
      ]

      for (const time of times) expect(index.at(time), `seed ${seed}, time ${time}`).toEqual(scanAll(list, time))
    }
  })

  it('accepts unsorted spans and keeps the order a full scan gives', () => {
    const unsorted = [span('c', 3, 4), span('a', 0, 2), span('b', 1, 3)]

    for (const time of [0, 1, 1.5, 2, 3, 3.5, 4]) expect(createActiveSyllableIndex(unsorted).at(time)).toEqual(scanAll(unsorted, time))
  })

  it('hands back the same array while the set does not change, and an empty one with nothing lit', () => {
    const index = createActiveSyllableIndex([span('a', 0, 2), span('b', 1, 3), span('c', 5, 6)])

    expect(index.at(1.2)).toBe(index.at(1.9))
    expect(index.at(0)).toBe(index.at(0.9))
    expect(index.at(4)).toBe(index.at(-1))
    expect(index.at(4)).toEqual([])
    expect(createActiveSyllableIndex([]).at(0)).toEqual([])
  })

  it('reads the spans only while building: a lookup touches no span', () => {
    let reads = 0
    const list = Array.from({ length: 1000 }, (_, i) => span(`s${i}`, i, i + 3))
    const counted = new Proxy(list, {
      get(target, key, receiver) {
        if (typeof key === 'string' && /^\d+$/.test(key)) reads++
        return Reflect.get(target, key, receiver)
      },
    })
    const index = createActiveSyllableIndex(counted)
    reads = 0

    for (let time = -5; time < 1010; time += 0.37) index.at(time)

    expect(reads).toBe(0)
  })

  it('never mutates or sorts its input', () => {
    const list = deepFreeze([span('c', 3, 4), span('a', 0, 2)])

    expect(() => createActiveSyllableIndex(list).at(3)).not.toThrow()
    expect(list.map((s) => s.syllable.syllableId)).toEqual(['c', 'a'])
  })

  it('measures 10^4 spans against a full scan (logged, no tight threshold)', () => {
    const random = seeded(42)
    const list = Array.from({ length: 10_000 }, (_, i) => span(`s${i % 500}`, i * 0.3, i * 0.3 + 0.2 + random()))
    const times = Array.from({ length: 2_000 }, () => random() * 3_100)

    let t0 = performance.now()
    const index = createActiveSyllableIndex(list)
    const build = performance.now() - t0
    t0 = performance.now()
    const fast = times.map((time) => index.at(time))
    const lookups = performance.now() - t0
    t0 = performance.now()
    const slow = times.map((time) => scanAll(list, time))
    const scans = performance.now() - t0
    console.info(
      `[index 10^4 spans, 2000 lookups] build ${build.toFixed(1)} ms, lookups ${lookups.toFixed(2)} ms, full scans ${scans.toFixed(1)} ms`,
    )

    expect(fast).toEqual(slow)
    expect(lookups).toBeLessThan(scans)
  })
})

describe('MEI from Verovio 6.4.1 (trimmed, MusicXML written for this test)', () => {
  // Real toolkit output: scoreDef and measure 2 of a self-composed two-part score, ids kept. Notes: `<label>` is a child
  // of `<staffDef>`; a lyric on a chord is a child of `<chord>`; MusicXML `<extend>` becomes `con="u"`, and
  // `<extend type="stop"/>` on a later note produces no `<syl>` at all, so it cannot be mistaken for a next syllable.
  const real = `<mei xmlns="http://www.music-encoding.org/ns/mei" meiversion="6.0-dev"><music><body><mdiv><score>
    <scoreDef xml:id="drt4n20"><staffGrp xml:id="fkpfhtn">
      <staffDef xml:id="P1" n="1" lines="5" ppq="1"><label xml:id="g1s9imy8">Nữ</label><clef xml:id="qusv579" shape="G" line="2" /></staffDef>
      <staffDef xml:id="P2" n="2" lines="5" ppq="1"><label xml:id="z3uxtvi">Nam</label><clef xml:id="j12hdfvi" shape="G" line="2" /></staffDef>
    </staffGrp></scoreDef>
    <section xml:id="e823vn9"><section xml:id="q14cyq42"><measure xml:id="t1byv6a2" n="1">
      <staff xml:id="c1ohqg19" n="1"><layer xml:id="dtpoxnv" n="1">
        <note xml:id="l13so4oy" dur.ppq="1" dur="4" oct="4" pname="d">
          <verse xml:id="mf97sb7" n="1"><syl xml:id="nc7ugu9" con="u" wordpos="s">mừng</syl></verse>
          <verse xml:id="p1vjulbk" n="2"><syl xml:id="qupy5x1" con="s" wordpos="s">dâng</syl></verse>
        </note>
        <note xml:id="sa5622h" dur.ppq="1" dur="4" oct="4" pname="e" />
        <chord xml:id="mnjyoj0" dur.ppq="2" dur="2">
          <verse xml:id="n1id5b75" n="1"><syl xml:id="o1vxxksm" con="s" wordpos="t">ca</syl></verse>
          <note xml:id="l1hlshyg" oct="4" pname="e" />
          <note xml:id="t1ic8z7u" oct="4" pname="g" />
        </chord>
      </layer></staff>
      <staff xml:id="vg1g4lm" n="2"><layer xml:id="w1h57zq3" n="1">
        <note xml:id="xn4hsnk" dur.ppq="4" dur="1" oct="3" pname="c">
          <verse xml:id="y18g5yia" n="1"><syl xml:id="ztwl9zl" con="s" wordpos="s">Trầm</syl></verse>
        </note>
      </layer></staff>
    </measure></section></section>
  </score></mdiv></body></music></mei>`
  const timemap = [
    { tstamp: 0, on: ['l13so4oy', 'xn4hsnk'] },
    { tstamp: 1000, on: ['sa5622h'], off: ['l13so4oy'] },
    { tstamp: 2000, on: ['l1hlshyg', 't1ic8z7u'], off: ['sa5622h'] },
    { tstamp: 4000, off: ['l1hlshyg', 't1ic8z7u', 'xn4hsnk'] },
  ]
  const syllables = assignParts(parseLyrics(real), resolveParts(real))
  const timeline = parseTimemap(timemap, undefined, parseTieMap(real))
  const melismas = parseMelismas(real)

  it('reads the parts and the staff/layer of a chord lyric', () => {
    expect(entries(real)).toEqual([
      ['1', 'nu', 'Nữ'],
      ['2', 'nam', 'Nam'],
    ])
    expect(syllables.find((s) => s.text === 'ca')).toMatchObject({ noteId: 'l1hlshyg', staff: '1', layer: '1', partKey: 'nu' })
    expect(listVerses(syllables, 'nu')).toEqual(['1', '2'])
  })

  it('holds the melisma to the chord lyric and lights two selected parts together', () => {
    const soprano = melismaSpans(selectLyrics(syllables, { partKey: 'nu', verse: '1' }), timeline, melismas)
    const men = melismaSpans(selectLyrics(syllables, { partKey: 'nam', verse: '1' }), timeline, melismas)

    expect(timesOf(soprano)).toEqual([
      ['mừng', 0, 2],
      ['ca', 2, 4],
    ])
    expect(activeSyllables([...soprano, ...men], { time: 1.5 })).toEqual(['nc7ugu9', 'ztwl9zl'])
    expect(activeSyllables([...soprano, ...men], { time: 2 })).toEqual(['o1vxxksm', 'ztwl9zl'])
  })

  // Real toolkit output (attributes the parser does not read removed) of a self-composed melody with a melisma over a
  // beam, over a tie, into a rest; one over a chord up to a new syllable; and one across a barline to the end of the layer.
  // Verse 2 has syllables on a note inside a verse-1 melisma. Timemap is the toolkit's own (renderToTimemap, 120 bpm).
  const inventory = doc(
    '',
    `<staff n="1"><layer n="1">
      <beam xml:id="y1no0ndv">
        <note xml:id="z1alv715"><verse n="1"><syl xml:id="bks5m6n" con="u">Ơn</syl></verse><verse n="2"><syl xml:id="e139fa3c" con="s">Một</syl></verse></note>
        <note xml:id="gpci32t"><verse n="2"><syl xml:id="ixduh8o" con="s">hai</syl></verse></note>
      </beam>
      <note xml:id="k17l2icd" /><note xml:id="m1eak39x" /><rest xml:id="nico1bp" />
    </layer></staff><tie xml:id="l13vpjtf" startid="#k17l2icd" endid="#m1eak39x" />
    </measure><measure n="2"><staff n="1"><layer n="1">
      <note xml:id="zppezwp"><verse n="1"><syl xml:id="bal7eov" con="u">Chúa</syl></verse></note>
      <chord xml:id="e1hb4cmk"><note xml:id="dxlesvk" /><note xml:id="f9eot7w" /></chord>
      <note xml:id="g6ldde9"><verse n="1"><syl xml:id="icahk4h" con="s">ơi</syl></verse></note>
      <note xml:id="k1dxkk5l"><verse n="1"><syl xml:id="m14orm7r" con="u">A</syl></verse></note>
    </layer></staff></measure><measure n="3"><staff n="1"><layer n="1">
      <note xml:id="z1f03h89" /><note xml:id="alep3l2" />
    </layer></staff>`,
  )
  const inventoryTimemap = [
    { on: ['z1alv715'], tstamp: 0 },
    { off: ['z1alv715'], on: ['gpci32t'], tstamp: 250 },
    { off: ['gpci32t'], on: ['k17l2icd'], tstamp: 500 },
    { off: ['k17l2icd'], on: ['m1eak39x'], tstamp: 1000 },
    { off: ['m1eak39x'], tstamp: 1500 },
    { on: ['zppezwp'], tstamp: 2000 },
    { off: ['zppezwp'], on: ['dxlesvk', 'f9eot7w'], tstamp: 2500 },
    { off: ['dxlesvk', 'f9eot7w'], on: ['g6ldde9'], tstamp: 3000 },
    { off: ['g6ldde9'], on: ['k1dxkk5l'], tstamp: 3500 },
    { off: ['k1dxkk5l'], on: ['z1f03h89'], tstamp: 4000 },
    { off: ['z1f03h89'], on: ['alep3l2'], tstamp: 4500 },
    { off: ['alep3l2'], tstamp: 5500 },
  ]

  it('holds real melismas over a beam and a tie up to a rest, over a chord, and across a barline', () => {
    const spans = held(inventory, inventoryTimemap)

    expect(timesOf(spans)).toEqual([
      ['Ơn', 0, 1.5],
      ['Một', 0, 0.25],
      ['hai', 0.25, 0.5],
      ['Chúa', 2, 3],
      ['ơi', 3, 3.5],
      ['A', 3.5, 5.5],
    ])
    expect(activeSyllables(spans, { time: 1.75 })).toEqual([])
  })
})
