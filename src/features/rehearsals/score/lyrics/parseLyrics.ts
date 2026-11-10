import type { PlaybackTimeline } from '../timeline/types'
import type { LyricSpan, LyricSyllable, WordPos } from './types'

const WORDPOS: readonly string[] = ['i', 'm', 't', 's']

/**
 * Reads `<verse><syl>` under `<note>` (or `<chord>`, keyed to its first note) from Verovio's MEI, in document order.
 * Same convention as `parseTieMap`: broken MEI never throws, it just yields nothing; elements missing an id are skipped.
 */
export function parseLyrics(mei: string): LyricSyllable[] {
  const doc = new DOMParser().parseFromString(mei, 'application/xml')
  const syllables: LyricSyllable[] = []

  for (const verse of Array.from(doc.getElementsByTagNameNS('*', 'verse'))) {
    const host = verse.parentElement
    const note = host?.localName === 'chord' ? Array.from(host.children).find((el) => el.localName === 'note') : host
    const noteId = note?.localName === 'note' ? note.getAttribute('xml:id') : null
    if (!noteId || !note) continue
    const n = verse.getAttribute('n')?.trim() || '1'
    const staff = ancestorN(note, 'staff')
    const layer = ancestorN(note, 'layer')

    Array.from(verse.children).filter((el) => el.localName === 'syl').forEach((syl, index) => {
      const wordpos = syl.getAttribute('wordpos') ?? ''
      const con = syl.getAttribute('con')
      syllables.push({
        syllableId: syl.getAttribute('xml:id') || `${noteId}#${n}#${index}`,
        noteId,
        verse: n,
        ...(staff !== undefined ? { staff } : {}),
        ...(layer !== undefined ? { layer } : {}),
        text: syl.textContent?.trim() ?? '',
        ...(WORDPOS.includes(wordpos) ? { wordpos: wordpos as WordPos } : {}),
        ...(con ? { con } : {}),
      })
    })
  }
  return syllables
}

/** `@n` of the nearest ancestor named `name`, undefined when there is none or it has no `@n`. */
export function ancestorN(el: Element, name: string): string | undefined {
  for (let p = el.parentElement; p; p = p.parentElement) if (p.localName === name) return p.getAttribute('n') ?? undefined
  return undefined
}

/**
 * One span per sounding occurrence of a syllable's note: from its onset to the tie group's `finalOff`. A lyric repeated
 * on a tie continuation adds no span when the group head carries the same verse (the head's span already covers it).
 */
export function lyricSpans(syllables: readonly LyricSyllable[], timeline: PlaybackTimeline): LyricSpan[] {
  const byNote = new Map<string, LyricSyllable[]>()
  for (const syllable of syllables) byNote.set(syllable.noteId, [...(byNote.get(syllable.noteId) ?? []), syllable])

  const spans: LyricSpan[] = []
  for (const event of timeline.events) {
    if (event.type !== 'on') continue
    for (const syllable of byNote.get(event.noteId) ?? []) {
      const headHasVerse = byNote.get(event.tieGroupId ?? '')?.some((s) => s.verse === syllable.verse)
      if (event.isTieContinuation && headHasVerse) continue
      spans.push({ syllable, start: event.time, end: event.finalOff })
    }
  }
  return spans
}
