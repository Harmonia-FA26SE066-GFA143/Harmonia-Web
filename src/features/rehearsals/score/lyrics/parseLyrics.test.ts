import { describe, expect, it } from 'vitest'
import { parseTieMap } from '../timeline/tieMap'
import { parseTimemap } from '../timeline/parseTimemap'
import { lyricSpans, parseLyrics } from './parseLyrics'

const mei = (body: string) =>
  `<?xml version="1.0" encoding="UTF-8"?><mei xmlns="http://www.music-encoding.org/ns/mei"><music><body><mdiv><score><section><measure><staff n="1"><layer n="1">${body}</layer></staff></measure></section></score></mdiv></body></music></mei>`

describe('parseLyrics', () => {
  it('turns one syl on one note into one syllable with wordpos and con', () => {
    const syllables = parseLyrics(
      mei(
        '<note xml:id="a"><verse n="1"><syl wordpos="i" con="d">Al</syl></verse></note>' +
          '<note xml:id="b"><verse n="1"><syl wordpos="m" con="d">le</syl></verse></note>' +
          '<note xml:id="c"><verse n="1"><syl wordpos="t">lu</syl></verse></note>' +
          '<note xml:id="d"><verse n="1"><syl wordpos="s">ia</syl></verse></note>',
      ),
    )

    expect(syllables).toEqual([
      { syllableId: 'a#1#0', noteId: 'a', verse: '1', staff: '1', layer: '1', text: 'Al', wordpos: 'i', con: 'd' },
      { syllableId: 'b#1#0', noteId: 'b', verse: '1', staff: '1', layer: '1', text: 'le', wordpos: 'm', con: 'd' },
      { syllableId: 'c#1#0', noteId: 'c', verse: '1', staff: '1', layer: '1', text: 'lu', wordpos: 't' },
      { syllableId: 'd#1#0', noteId: 'd', verse: '1', staff: '1', layer: '1', text: 'ia', wordpos: 's' },
    ])
  })

  it('returns one syllable per verse n on the same note', () => {
    const syllables = parseLyrics(
      mei('<note xml:id="a"><verse n="1"><syl>Chúa</syl></verse><verse n="2"><syl>Lạy</syl></verse></note>'),
    )

    expect(syllables.map(({ verse, text }) => ({ verse, text }))).toEqual([
      { verse: '1', text: 'Chúa' },
      { verse: '2', text: 'Lạy' },
    ])
  })

  it('keeps verse@n as a string id: missing -> "1", "0" and "A" stay apart', () => {
    const syllables = parseLyrics(
      mei('<note xml:id="a"><verse><syl>x</syl></verse><verse n="0"><syl>y</syl></verse><verse n=" A "><syl>z</syl></verse></note>'),
    )

    expect(syllables.map((s) => s.verse)).toEqual(['1', '0', 'A'])
  })

  it('produces nothing for notes without lyrics', () => {
    expect(parseLyrics(mei('<note xml:id="a"/><rest xml:id="r"/><note xml:id="b"/>'))).toEqual([])
  })

  it('keeps every letter of a syl with nested elements', () => {
    const [syllable] = parseLyrics(mei('<note xml:id="a"><verse n="1"><syl>Ha<rend fontstyle="italic">lle</rend>lu</syl></verse></note>'))

    expect(syllable.text).toBe('Hallelu')
  })

  it('mirrors parseTieMap on broken or rootless MEI: no throw, empty result', () => {
    // parseTieMap (timeline/tieMap.ts) never throws: DOMParser returns a parsererror document and nothing is found.
    for (const broken of ['<mei><note xml:id="a"><verse>', '', 'not xml at all']) {
      expect(parseTieMap(broken).size).toBe(0)
      expect(parseLyrics(broken)).toEqual([])
    }
  })

  it('attaches a verse under <chord> to the first note of the chord', () => {
    // Assumption: MEI allows <verse> as a child of <chord>; Verovio's timemap only lists the chord's <note> ids, all
    // with the same onset and duration, so the lyric is keyed to the first <note> in document order.
    const syllables = parseLyrics(
      mei('<chord xml:id="ch"><note xml:id="lo"/><note xml:id="hi"/><verse n="1"><syl>Ky</syl></verse></chord>'),
    )

    expect(syllables.map(({ noteId, verse, text }) => ({ noteId, verse, text }))).toEqual([{ noteId: 'lo', verse: '1', text: 'Ky' }])
  })

  it('keeps a verse written on a note inside a chord on that note', () => {
    const syllables = parseLyrics(mei('<chord><note xml:id="lo"/><note xml:id="hi"><verse n="1"><syl>ri</syl></verse></note></chord>'))

    expect(syllables.map(({ noteId, verse, text }) => ({ noteId, verse, text }))).toEqual([{ noteId: 'hi', verse: '1', text: 'ri' }])
  })

  it('tells SATB staves apart by staff and layer', () => {
    const doc =
      '<?xml version="1.0"?><mei xmlns="http://www.music-encoding.org/ns/mei"><music><body><mdiv><score><section><measure>' +
      '<staff n="1"><layer n="1"><note xml:id="s"><verse n="1"><syl>Glo</syl></verse></note></layer></staff>' +
      '<staff n="2"><layer n="2"><note xml:id="a"><verse n="1"><syl>Glo</syl></verse></note></layer></staff>' +
      '</measure></section></score></mdiv></body></music></mei>'

    expect(parseLyrics(doc).map(({ noteId, staff, layer }) => ({ noteId, staff, layer }))).toEqual([
      { noteId: 's', staff: '1', layer: '1' },
      { noteId: 'a', staff: '2', layer: '2' },
    ])
  })

  it('leaves staff and layer undefined without such ancestors', () => {
    const [syllable] = parseLyrics('<mei xmlns="http://www.music-encoding.org/ns/mei"><note xml:id="a"><verse n="1"><syl>x</syl></verse></note></mei>')

    expect(syllable.noteId).toBe('a')
    expect(syllable.staff).toBeUndefined()
    expect(syllable.layer).toBeUndefined()
  })

  it('uses syl xml:id as syllableId', () => {
    const syllables = parseLyrics(mei('<note xml:id="a"><verse n="1"><syl xml:id="s1">ri</syl><syl xml:id="s2">a</syl></verse></note>'))

    expect(syllables.map((s) => s.syllableId)).toEqual(['s1', 's2'])
  })

  it('builds a stable syllableId without xml:id, keeping syl order inside a verse', () => {
    const doc = mei('<note xml:id="a"><verse n="2"><syl>ri</syl><syl>a</syl></verse></note>')
    const first = parseLyrics(doc)

    expect(first.map(({ syllableId, text }) => ({ syllableId, text }))).toEqual([
      { syllableId: 'a#2#0', text: 'ri' },
      { syllableId: 'a#2#1', text: 'a' },
    ])
    expect(parseLyrics(doc).map((s) => s.syllableId)).toEqual(first.map((s) => s.syllableId))
  })
})

describe('lyricSpans', () => {
  // a ~ b ~ c tied (a sounds 0-1s, b 1-2s, c 2-3s); d is a plain note 3-4s.
  const tiedMei = (body: string) => mei(`${body}<tie startid="#a" endid="#b"/><tie startid="#b" endid="#c"/>`)
  const timemap = [
    { tstamp: 0, on: ['a'] },
    { tstamp: 1000, on: ['b'], off: ['a'] },
    { tstamp: 2000, on: ['c'], off: ['b'] },
    { tstamp: 3000, on: ['d'], off: ['c'] },
    { tstamp: 4000, off: ['d'] },
  ]
  const spansFor = (body: string) => {
    const doc = tiedMei(body)
    return lyricSpans(parseLyrics(doc), parseTimemap(timemap, undefined, parseTieMap(doc))).map(({ syllable, start, end }) => ({
      text: syllable.text,
      start,
      end,
    }))
  }

  it('lights a lyric on the tie head from its onset to the off of the last tied note', () => {
    expect(spansFor('<note xml:id="a"><verse n="1"><syl>Glo</syl></verse></note><note xml:id="b"/><note xml:id="c"/><note xml:id="d"/>')).toEqual([
      { text: 'Glo', start: 0, end: 3 },
    ])
  })

  it('does not add a duplicate span for a lyric repeated on a tie continuation', () => {
    expect(
      spansFor(
        '<note xml:id="a"><verse n="1"><syl>Glo</syl></verse></note><note xml:id="b"><verse n="1"><syl>Glo</syl></verse></note>' +
          '<note xml:id="c"/><note xml:id="d"><verse n="1"><syl>ri</syl></verse></note>',
      ),
    ).toEqual([
      { text: 'Glo', start: 0, end: 3 },
      { text: 'ri', start: 3, end: 4 },
    ])
  })

  it('still lights a continuation lyric whose verse the head does not carry', () => {
    expect(
      spansFor(
        '<note xml:id="a"><verse n="1"><syl>Glo</syl></verse></note><note xml:id="b"><verse n="2"><syl>ri</syl></verse></note>' +
          '<note xml:id="c"/><note xml:id="d"/>',
      ),
    ).toEqual([
      { text: 'Glo', start: 0, end: 3 },
      { text: 'ri', start: 1, end: 3 },
    ])
  })

  it('gives one span per occurrence of a repeated tie group', () => {
    const doc = mei('<note xml:id="a"><verse n="1"><syl>Glo</syl></verse></note><note xml:id="b"/><tie startid="#a" endid="#b"/>')
    const repeated = [
      { tstamp: 1000, on: ['a'] },
      { tstamp: 2000, on: ['b'], off: ['a'] },
      { tstamp: 3000, off: ['b'] },
      { tstamp: 5000, on: ['a'] },
      { tstamp: 6000, on: ['b'], off: ['a'] },
      { tstamp: 8000, off: ['b'] },
    ]
    const spans = lyricSpans(parseLyrics(doc), parseTimemap(repeated, undefined, parseTieMap(doc)))

    expect(spans.map(({ start, end }) => [start, end])).toEqual([
      [1, 3],
      [5, 8],
    ])
  })

  it('gives a plain note its own on/off span', () => {
    expect(spansFor('<note xml:id="a"/><note xml:id="b"/><note xml:id="c"/><note xml:id="d"><verse n="1"><syl>a</syl></verse></note>')).toEqual([
      { text: 'a', start: 3, end: 4 },
    ])
  })
})
