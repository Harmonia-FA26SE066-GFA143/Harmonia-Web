import type { AliasMap, PlaybackTimeline, RawTimemapEntry, TieMap, TimelineEvent } from './types'

interface Occurrence {
  elementId: string
  noteId: string
  /** n-th time this canonical note sounds (0-based), used to pair tie heads with their continuations. */
  index: number
  onTime: number
  onSeq: number
  offTime?: number
  offSeq?: number
}

interface OrphanOff {
  elementId: string
  noteId: string
  time: number
  seq: number
}

/**
 * Turns Verovio's timemap into a sorted on/off event list. Ids are mapped to canonical note ids by lookup in
 * `aliases` only (never by cutting a `-rendN` suffix). Tied noteheads keep their own on/off events; `ties` only
 * adds group info and `finalOff`.
 */
export function parseTimemap(entries: readonly RawTimemapEntry[], aliases?: AliasMap, ties?: TieMap): PlaybackTimeline {
  const sorted = entries.map((entry, order) => ({ entry, order })).sort((a, b) => a.entry.tstamp - b.entry.tstamp || a.order - b.order)
  const duration = sorted.length > 0 ? sorted[sorted.length - 1].entry.tstamp / 1000 : 0

  const toCanonical = (id: string) => aliases?.get(id) ?? id
  const occurrences: Occurrence[] = []
  const orphanOffs: OrphanOff[] = []
  const open = new Map<string, Occurrence[]>()
  const seen = new Map<string, number>()
  let seq = 0

  for (const { entry } of sorted) {
    const time = entry.tstamp / 1000
    for (const elementId of entry.off ?? []) {
      const opened = open.get(elementId)?.shift()
      if (opened) {
        opened.offTime = time
        opened.offSeq = seq++
      } else {
        orphanOffs.push({ elementId, noteId: toCanonical(elementId), time, seq: seq++ })
      }
    }
    for (const elementId of entry.on ?? []) {
      const noteId = toCanonical(elementId)
      const index = seen.get(noteId) ?? 0
      seen.set(noteId, index + 1)
      const occurrence: Occurrence = { elementId, noteId, index, onTime: time, onSeq: seq++ }
      occurrences.push(occurrence)
      open.set(elementId, [...(open.get(elementId) ?? []), occurrence])
    }
  }

  const finalOffs = computeFinalOffs(occurrences, duration, ties)
  const ranked: { event: TimelineEvent; seq: number }[] = []
  const onsets = new Map<string, number[]>()

  for (const occurrence of occurrences) {
    const tie = ties?.get(occurrence.noteId)
    const base = {
      noteId: occurrence.noteId,
      elementId: occurrence.elementId,
      isTieContinuation: tie?.isTieContinuation ?? false,
      finalOff: finalOffs.get(occurrence) ?? duration,
      ...(tie ? { tieGroupId: tie.tieGroupId } : {}),
    }
    ranked.push({ event: { ...base, time: occurrence.onTime, type: 'on' }, seq: occurrence.onSeq })
    if (occurrence.offTime !== undefined && occurrence.offSeq !== undefined) {
      ranked.push({ event: { ...base, time: occurrence.offTime, type: 'off' }, seq: occurrence.offSeq })
    }
    onsets.set(occurrence.noteId, [...(onsets.get(occurrence.noteId) ?? []), occurrence.onTime])
  }
  for (const orphan of orphanOffs) {
    const tie = ties?.get(orphan.noteId)
    ranked.push({
      event: {
        noteId: orphan.noteId,
        elementId: orphan.elementId,
        isTieContinuation: tie?.isTieContinuation ?? false,
        finalOff: orphan.time,
        time: orphan.time,
        type: 'off',
        ...(tie ? { tieGroupId: tie.tieGroupId } : {}),
      },
      seq: orphan.seq,
    })
  }

  ranked.sort((a, b) => a.event.time - b.event.time || typeRank(a.event) - typeRank(b.event) || a.seq - b.seq)
  return { events: ranked.map((item) => item.event), onsets, duration }
}

function typeRank(event: TimelineEvent): number {
  return event.type === 'off' ? 0 : 1
}

/** Own off per occurrence; for tied notes, the latest off among the same-numbered occurrence of every group member. */
function computeFinalOffs(occurrences: readonly Occurrence[], duration: number, ties?: TieMap): Map<Occurrence, number> {
  const ownOff = (occurrence: Occurrence) => occurrence.offTime ?? duration
  const groupMax = new Map<string, number>()
  const groupKey = (occurrence: Occurrence) => {
    const tie = ties?.get(occurrence.noteId)
    return tie ? `${tie.tieGroupId}#${occurrence.index}` : undefined
  }

  for (const occurrence of occurrences) {
    const key = groupKey(occurrence)
    if (key) groupMax.set(key, Math.max(groupMax.get(key) ?? 0, ownOff(occurrence)))
  }

  const finalOffs = new Map<Occurrence, number>()
  for (const occurrence of occurrences) {
    const key = groupKey(occurrence)
    finalOffs.set(occurrence, key ? (groupMax.get(key) ?? ownOff(occurrence)) : ownOff(occurrence))
  }
  return finalOffs
}
