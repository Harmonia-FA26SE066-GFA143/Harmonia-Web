/** One entry of Verovio's `renderToTimemap()` output. Only the fields the playback timeline uses. */
export interface RawTimemapEntry {
  /** Milliseconds from the start of the rendered score. */
  tstamp: number
  on?: string[]
  off?: string[]
}

/** Canonical note id -> tie info (built from the MEI by `parseTieMap`). Independent of `AliasMap`. */
export type TieMap = ReadonlyMap<string, { tieGroupId: string; isTieContinuation: boolean; members: readonly string[] }>

/** Alias id (for example a repeated `-rendN` id) -> canonical id, from Verovio's expansion map. */
export type AliasMap = ReadonlyMap<string, string>

export interface TimelineEvent {
  /** Seconds. */
  time: number
  /** Canonical id: the id of the original SVG note. */
  noteId: string
  /** Raw id as written in the timemap. */
  elementId: string
  type: 'on' | 'off'
  tieGroupId?: string
  isTieContinuation: boolean
  /** Seconds. Off of the last notehead of the tie group in the same occurrence; own off when there is no tie. */
  finalOff: number
}

export interface PlaybackTimeline {
  /** Sorted by time; `off` before `on` at equal time. */
  events: readonly TimelineEvent[]
  /** Canonical note id -> onsets in seconds, ascending, across every repeat. */
  onsets: ReadonlyMap<string, readonly number[]>
  /** Seconds. */
  duration: number
}
