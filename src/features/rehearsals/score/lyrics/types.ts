/** MEI `syl@wordpos`: initial, medial, terminal or single syllable of a word. */
export type WordPos = 'i' | 'm' | 't' | 's'

/** One `<syl>` of one `<verse>`, keyed to the canonical note id the timeline uses. */
export interface LyricSyllable {
  /** `syl@xml:id`, else `${noteId}#${verse}#${index of the syl in its verse}` (stable across parses). */
  syllableId: string
  noteId: string
  /** `verse@n` as an identifier string (trimmed, never coerced to a number); `'1'` when absent. */
  verse: string
  /** `@n` of the note's nearest `<staff>` / `<layer>` ancestor; mapping to a part is not done here. */
  staff?: string
  layer?: string
  text: string
  wordpos?: WordPos
  /** MEI `syl@con` as written (`d` dash, `u` underscore/melisma, `s` space, ...). */
  con?: string
}

/** `staff@n` -> its part, in `staffDef` document order. `partKey` convention: see `resolveParts`. */
export type PartTable = ReadonlyMap<string, { partKey: string; label: string }>

/** A syllable tagged with the part of its staff (`assignParts`). */
export interface PartSyllable extends LyricSyllable {
  partKey: string
}

/** `${noteId}\0${verse}` -> ids of the notes a melisma on that note and verse would carry (`parseMelismas`). */
export type MelismaMap = ReadonlyMap<string, readonly string[]>

/** Seconds during which a syllable is lit; one per sounding occurrence of its note. */
export interface LyricSpan {
  syllable: LyricSyllable
  start: number
  /** `finalOff` of the note's tie group, so a tied lyric stays lit past its first notehead. */
  end: number
}
