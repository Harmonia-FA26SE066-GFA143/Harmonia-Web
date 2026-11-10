import type { PlaybackTimeline, TimelineEvent } from '../timeline/types'
import { ancestorN, lyricSpans } from './parseLyrics'
import type { LyricSpan, LyricSyllable, MelismaMap, PartSyllable, PartTable } from './types'

/**
 * Maps each `staff@n` to a part, one part per staff, in `staffDef` document order. The display label is the `<label>` of
 * the `staffDef`, else of its nearest labelled `staffGrp` (Verovio's shape for one MusicXML part on two staves), else
 * `Bè <order>`; staves sharing a label get ` 1`, ` 2`, ... so they stay apart.
 *
 * `partKey` convention: the label lowercased, without diacritics, runs of anything else than a-z0-9 turned into `-`
 * ("Nữ cao" -> `nu-cao`, no label -> `be-<order>`). A label with nothing left falls back to `be-<order>`; a key already
 * taken gets `-2`, `-3`, ... Broken MEI yields an empty table, same convention as `parseLyrics`.
 */
export function resolveParts(mei: string): PartTable {
  const doc = new DOMParser().parseFromString(mei, 'application/xml')
  const written = new Map<string, string | undefined>()
  for (const staffDef of Array.from(doc.getElementsByTagNameNS('*', 'staffDef'))) {
    const n = staffDef.getAttribute('n')?.trim()
    if (n && !written.has(n)) written.set(n, labelOf(staffDef))
  }

  const bases = [...written.values()].map((label, i) => label ?? `Bè ${i + 1}`)
  const seen = new Map<string, number>()
  const used = new Set<string>()
  const parts = new Map<string, { partKey: string; label: string }>()
  ;[...written.keys()].forEach((n, i) => {
    const base = bases[i]
    const nth = (seen.get(base) ?? 0) + 1
    seen.set(base, nth)
    const label = bases.filter((other) => other === base).length > 1 ? `${base} ${nth}` : base
    const root = slug(label) || `be-${i + 1}`
    let partKey = root
    for (let suffix = 2; used.has(partKey); suffix++) partKey = `${root}-${suffix}`
    used.add(partKey)
    parts.set(n, { partKey, label })
  })
  return parts
}

function labelOf(staffDef: Element): string | undefined {
  for (let el: Element | null = staffDef; el && (el === staffDef || el.localName === 'staffGrp'); el = el.parentElement) {
    const text = Array.from(el.children).find((child) => child.localName === 'label')?.textContent?.trim()
    if (text) return text
  }
  return undefined
}

function slug(label: string): string {
  return label
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Tags syllables with their part; a syllable whose staff has no `staffDef` belongs to no part and is dropped. */
export function assignParts(syllables: readonly LyricSyllable[], parts: PartTable): PartSyllable[] {
  return syllables.flatMap((syllable) => {
    const part = syllable.staff === undefined ? undefined : parts.get(syllable.staff)
    return part ? [{ ...syllable, partKey: part.partKey }] : []
  })
}

/** The syllables of one part and verse, in document order. `verse` is compared as a string, like `LyricSyllable.verse`. */
export function selectLyrics(syllables: readonly PartSyllable[], selection: { partKey: string; verse: string }): PartSyllable[] {
  return syllables.filter((s) => s.partKey === selection.partKey && s.verse === selection.verse)
}

/** The verses of one part in order of first appearance; never sorted, since `n` may be `'A'` or `'0'`. */
export function listVerses(syllables: readonly PartSyllable[], partKey: string): string[] {
  return [...new Set(syllables.filter((s) => s.partKey === partKey).map((s) => s.verse))]
}

const SILENCE = new Set(['rest', 'mRest', 'multiRest', 'space', 'mSpace'])
const melismaKey = (noteId: string, verse: string) => `${noteId}\0${verse}`
const verseN = (verse: Element) => verse.getAttribute('n')?.trim() || '1'
const childrenNamed = (el: Element, name: string) => Array.from(el.children).filter((child) => child.localName === name)

/** A timed event of a layer: a note outside a chord, a chord, or a rest/space. Grace notes take no time and are skipped. */
const isLayerItem = (el: Element) =>
  !el.hasAttribute('grace') &&
  (SILENCE.has(el.localName) || el.localName === 'chord' || (el.localName === 'note' && el.parentElement?.localName !== 'chord'))

/** `<verse>`s of a note, or of a chord and its notes. */
const versesOf = (item: Element) => [
  ...childrenNamed(item, 'verse'),
  ...childrenNamed(item, 'note').flatMap((note) => childrenNamed(note, 'verse')),
]

/** Note id the timeline uses for a layer item (first note of a chord, as `parseLyrics` keys chord lyrics). */
const noteIdOf = (item: Element) => (item.localName === 'chord' ? childrenNamed(item, 'note')[0] : item)?.getAttribute('xml:id') || undefined

/**
 * For each note and verse with lyrics: the ids of the notes a melisma on it would carry, read from MEI (`melismaSpans`
 * decides which syllable holds). They are the notes right after it in the same staff and layer (across barlines, through beams and tuplets), up to a
 * rest/space, a note carrying a syllable of the same verse, a note without id, or the end of the layer. Keyed by note id
 * and verse; an empty list means the melisma has no note after its own. Broken MEI yields an empty map.
 */
export function parseMelismas(mei: string): MelismaMap {
  const doc = new DOMParser().parseFromString(mei, 'application/xml')
  const layers = new Map<string, Element[]>()
  for (const layer of Array.from(doc.getElementsByTagNameNS('*', 'layer'))) {
    const key = `${ancestorN(layer, 'staff')}\0${layer.getAttribute('n')}`
    layers.set(key, [...(layers.get(key) ?? []), ...Array.from(layer.getElementsByTagNameNS('*', '*')).filter(isLayerItem)])
  }

  const melismas = new Map<string, readonly string[]>()
  for (const items of layers.values()) {
    items.forEach((item, i) => {
      for (const verse of versesOf(item)) {
        const host = verse.parentElement
        const noteId = host && noteIdOf(host)
        if (!noteId || childrenNamed(verse, 'syl').length === 0) continue
        const n = verseN(verse)
        const notes: string[] = []
        for (const next of items.slice(i + 1)) {
          const sung = versesOf(next).some((v) => verseN(v) === n && childrenNamed(v, 'syl').length > 0)
          const id = noteIdOf(next)
          if (SILENCE.has(next.localName) || sung || !id) break
          notes.push(id)
        }
        melismas.set(melismaKey(noteId, n), notes)
      }
    })
  }
  return melismas
}

/** Two times closer than this are the same instant (both come from integer-millisecond tstamps). */
const SAME_TIME = 1e-6

/**
 * `lyricSpans` plus melisma: a `con="u"` syllable stays lit over its melisma notes (`parseMelismas`), as long as each
 * one starts in playback exactly when the hold so far ends; it then ends with the last of them. A rest, a gap, a new
 * syllable, the end of the layer or a melisma that `melismas` does not know ends it at the syllable's own span. Never
 * held to the next lyric or to the end of the piece. `con="d"`, and a `con="u"` followed by another syl of its verse on
 * the same note, are not extended; a span is never shortened.
 */
export function melismaSpans(syllables: readonly LyricSyllable[], timeline: PlaybackTimeline, melismas: MelismaMap): LyricSpan[] {
  const onsByNote = new Map<string, TimelineEvent[]>()
  for (const event of timeline.events) {
    if (event.type !== 'on') continue
    const list = onsByNote.get(event.noteId)
    if (list) list.push(event)
    else onsByNote.set(event.noteId, [event])
  }
  const lastOfVerse = new Map<string, LyricSyllable>()
  for (const syllable of syllables) lastOfVerse.set(melismaKey(syllable.noteId, syllable.verse), syllable)

  return lyricSpans(syllables, timeline).map((span) => {
    const key = melismaKey(span.syllable.noteId, span.syllable.verse)
    if (span.syllable.con !== 'u' || lastOfVerse.get(key) !== span.syllable) return span
    let end = span.end
    for (const noteId of melismas.get(key) ?? []) {
      const ons = onsByNote.get(noteId) ?? []
      const next = ons.find((event) => Math.abs(event.time - end) < SAME_TIME)
      if (next) end = Math.max(end, next.finalOff)
      // A tie continuation sounds inside the hold already (the head's finalOff covers it); anything else ends it.
      else if (!ons.some((event) => event.time >= span.start && event.time < end)) break
    }
    return end === span.end ? span : { ...span, end }
  })
}

export interface ActiveSyllableIndex {
  /** Same result as a full scan of the spans: lit ids in span order, no repeats. The same array is returned for the same set. */
  at(time: number): readonly string[]
}

const NONE: readonly string[] = Object.freeze([])

/**
 * Builds, once, the lit set of every interval between span boundaries; `at(time)` is then a binary search, whatever the
 * direction of the seek. Spans are `[start, end)`, the same boundary as `createTimelineCursor` (lit at its on, already
 * off at its off); empty or reversed spans never light. The input is read during the build only, never sorted or mutated.
 */
export function createActiveSyllableIndex(spans: readonly LyricSpan[]): ActiveSyllableIndex {
  const live = spans.flatMap((span, order) => (span.start < span.end ? [{ order, start: span.start, end: span.end, id: span.syllable.syllableId }] : []))
  const bounds = [...new Set(live.flatMap((span) => [span.start, span.end]))].sort((a, b) => a - b)
  const byStart = [...live].sort((a, b) => a.start - b.start)
  const interned = new Map<string, readonly string[]>([['', NONE]])
  const active = new Set<(typeof live)[number]>()
  let added = 0

  // sets[k] is lit on [bounds[k], bounds[k + 1]).
  const sets = bounds.map((bound) => {
    for (const span of active) if (span.end <= bound) active.delete(span)
    while (added < byStart.length && byStart[added].start <= bound) active.add(byStart[added++])
    const ids = [...new Set([...active].sort((a, b) => a.order - b.order).map((span) => span.id))]
    const key = ids.join('\0')
    if (!interned.has(key)) interned.set(key, Object.freeze(ids))
    return interned.get(key)!
  })

  return {
    at(time) {
      let lo = 0
      let hi = bounds.length
      while (lo < hi) {
        const mid = (lo + hi) >>> 1
        if (bounds[mid] <= time) lo = mid + 1
        else hi = mid
      }
      return lo === 0 ? NONE : sets[lo - 1]
    },
  }
}

const indexes = new WeakMap<readonly LyricSpan[], ActiveSyllableIndex>()

/**
 * `createActiveSyllableIndex(spans).at(cursorState.time)`, with the index cached per spans array, so a caller passing the
 * same array every tick builds it once. Pass a new array when the spans change (they are `readonly`).
 */
export function activeSyllables(spans: readonly LyricSpan[], cursorState: { readonly time: number }): readonly string[] {
  let index = indexes.get(spans)
  if (!index) {
    index = createActiveSyllableIndex(spans)
    indexes.set(spans, index)
  }
  return index.at(cursorState.time)
}
