import { useMemo, useState } from 'react'
import {
  assignParts,
  createActiveSyllableIndex,
  listVerses,
  melismaSpans,
  parseLyrics,
  parseMelismas,
  resolveParts,
  selectLyrics,
  type ActiveSyllableIndex,
  type MelismaMap,
  type PartSyllable,
} from '../lyrics'
import type { PlaybackTimeline } from '../timeline/types'

/** The lyrics of one load, read once from its MEI; ids only hold for that load. */
export interface ScoreLyrics {
  syllables: readonly PartSyllable[]
  parts: readonly LyricPart[]
  melismas: MelismaMap
  timeline: PlaybackTimeline
}

export interface LyricPart {
  partKey: string
  label: string
}

/**
 * Null when the score has no lyric on a staff with a `staffDef` (or the MEI is broken): the page then offers no lyric
 * choice. One staff is one part (`resolveParts`), so a part written on two staves shows as two (`Soprano 1`, `Soprano 2`).
 */
export function readLyrics(mei: string, timeline: PlaybackTimeline): ScoreLyrics | null {
  const table = resolveParts(mei)
  const syllables = assignParts(parseLyrics(mei), table)
  if (syllables.length === 0) return null
  const sung = new Set(syllables.map((s) => s.partKey))
  const parts = [...table.values()].filter((part) => sung.has(part.partKey))
  return { syllables, parts, melismas: parseMelismas(mei), timeline }
}

export interface LyricSelection {
  partKey: string
  verse: string
}

/**
 * Which part and verse the page follows, kept in page state only. Starts on the first part with lyrics and its first
 * verse; a verse the newly chosen part does not have falls back to its first. Another `scoreKey` starts over. The index
 * is built once per load and choice, never per render.
 */
export function useLyricSelection(lyrics: ScoreLyrics | null, scoreKey: string) {
  const [chosen, setChosen] = useState<{ scoreKey: string; partKey?: string; verse?: string }>({ scoreKey })
  const current = chosen.scoreKey === scoreKey ? chosen : { scoreKey }
  const parts = lyrics?.parts ?? []
  const partKey = parts.some((part) => part.partKey === current.partKey) ? current.partKey : parts[0]?.partKey
  const verses = useMemo(() => (lyrics && partKey ? listVerses(lyrics.syllables, partKey) : []), [lyrics, partKey])
  const verse = current.verse !== undefined && verses.includes(current.verse) ? current.verse : verses[0]

  const index = useMemo<ActiveSyllableIndex | null>(
    () =>
      lyrics && partKey && verse !== undefined
        ? createActiveSyllableIndex(melismaSpans(selectLyrics(lyrics.syllables, { partKey, verse }), lyrics.timeline, lyrics.melismas))
        : null,
    [lyrics, partKey, verse],
  )

  return {
    parts,
    verses,
    selection: partKey && verse !== undefined ? { partKey, verse } : undefined,
    index,
    choosePart: (next: string) => setChosen({ scoreKey, partKey: next, verse }),
    chooseVerse: (next: string) => setChosen({ scoreKey, partKey, verse: next }),
  }
}
