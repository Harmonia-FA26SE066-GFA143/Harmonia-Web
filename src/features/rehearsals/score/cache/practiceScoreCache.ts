import type { ScoreLyrics } from '../controls/useLyricSelection'
import type { ScoreEngine } from '../engine'
import type { ScorePackage } from '../source/types'
import type { PlaybackTimeline } from '../timeline/types'

export interface PreparedScore {
  package: ScorePackage
  engine: ScoreEngine
  fileName: string
  svgPages: string[]
  timeline: PlaybackTimeline
  notesEndSeconds?: number
  lyrics: ScoreLyrics | null
  staves: number
  pageWidth: number
  zoom: number
  multiStaff: boolean
  estimatedBytes: number
}

type CachedScore = { identity: string; prepared: PreparedScore }

/**
 * Room-scoped cache: the active score plus at most three idle scores means no more than four live Verovio engines.
 * The byte ceiling covers downloaded files and rendered SVG strings; engine/WASM memory is additionally bounded by
 * the entry count. A closed cache disposes late puts, so parent/child effect cleanup order cannot leak resources.
 */
export interface PracticeScoreCache {
  take(key: string, identity?: string): PreparedScore | undefined
  put(key: string, identity: string, prepared: PreparedScore): void
  open(): void
  close(): void
}

export const MAX_IDLE_SCORES = 3
export const MAX_IDLE_BYTES = 96 * 1024 * 1024

export const disposePrepared = (prepared: PreparedScore) => {
  prepared.engine.dispose()
  prepared.package.dispose()
}

export function createPracticeScoreCache(): PracticeScoreCache {
  const entries = new Map<string, CachedScore>()
  let bytes = 0
  let closed = false
  const remove = (key: string, dispose: boolean) => {
    const entry = entries.get(key)
    if (!entry) return undefined
    entries.delete(key)
    bytes -= entry.prepared.estimatedBytes
    if (dispose) disposePrepared(entry.prepared)
    return entry.prepared
  }
  const trim = () => {
    while (entries.size > MAX_IDLE_SCORES || bytes > MAX_IDLE_BYTES) {
      const oldest = entries.keys().next().value as string | undefined
      if (oldest === undefined) return
      remove(oldest, true)
    }
  }
  return {
    take(key, identity) {
      if (identity) {
        for (const [otherKey, entry] of entries) {
          if (otherKey !== key && entry.identity === identity) remove(otherKey, true)
        }
      }
      const hit = remove(key, false)
      trim()
      return hit
    },
    put(key, identity, prepared) {
      if (closed) return disposePrepared(prepared)
      for (const [otherKey, entry] of entries) {
        if (entry.identity === identity) remove(otherKey, true)
      }
      remove(key, true)
      entries.set(key, { identity, prepared })
      bytes += prepared.estimatedBytes
      // Deferred so a passive unmount `put` followed in the same React commit (or StrictMode double-effect pass) by a
      // passive mount `take` can claim its entry before the idle ceiling is enforced.
      queueMicrotask(trim)
    },
    open() {
      closed = false
    },
    close() {
      if (closed) return
      closed = true
      for (const key of [...entries.keys()]) remove(key, true)
    },
  }
}

export function estimatedPreparedBytes(scorePackage: ScorePackage, svgPages: readonly string[], timeline: PlaybackTimeline) {
  const scoreBytes =
    typeof scorePackage.score.data === 'string'
      ? scorePackage.score.data.length * 2
      : scorePackage.score.data.byteLength
  const renderedBytes = svgPages.reduce((total, page) => total + page.length * 2, 0)
  const timelineBytes = timeline.events.length * 64 + timeline.onsets.size * 32
  return (scorePackage.estimatedBytes ?? scoreBytes) + renderedBytes + timelineBytes
}
