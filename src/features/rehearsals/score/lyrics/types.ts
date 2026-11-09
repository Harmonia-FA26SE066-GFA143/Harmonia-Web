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

/** Seconds during which a syllable is lit; one per sounding occurrence of its note. */
export interface LyricSpan {
  syllable: LyricSyllable
  start: number
  /** `finalOff` of the note's tie group, so a tied lyric stays lit past its first notehead. */
  end: number
}
