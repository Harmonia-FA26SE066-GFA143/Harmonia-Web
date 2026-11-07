import type { PlaybackTimeline } from './types'

export interface TimelineCursor {
  /** Moves to `time` (seconds) and returns what changed in the active set since the previous call. */
  advance(time: number): { added: string[]; removed: string[] }
  active(): ReadonlySet<string>
  reset(): void
}

/**
 * Tracks which canonical note ids sound at a given time. Ids are reference-counted so overlapping occurrences of
 * the same note stay active until the last one ends. The diff is taken against the set before the call, so a tie
 * boundary (off of the head, on of the continuation at the same time) arrives as one swap.
 */
export function createTimelineCursor(timeline: PlaybackTimeline): TimelineCursor {
  const { events } = timeline
  const counts = new Map<string, number>()
  const active = new Set<string>()
  let applied = 0 // number of events already applied

  const apply = (from: number, to: number) => {
    for (let i = from; i < to; i++) {
      const { noteId, type } = events[i]
      const next = (counts.get(noteId) ?? 0) + (type === 'on' ? 1 : -1)
      if (next <= 0) {
        // an off with no matching on is ignored instead of going negative
        counts.delete(noteId)
        active.delete(noteId)
      } else {
        counts.set(noteId, next)
        active.add(noteId)
      }
    }
  }

  const clear = () => {
    counts.clear()
    active.clear()
    applied = 0
  }

  // Number of events with time <= `time`.
  const upperBound = (time: number) => {
    let lo = 0
    let hi = events.length
    while (lo < hi) {
      const mid = (lo + hi) >>> 1
      if (events[mid].time <= time) lo = mid + 1
      else hi = mid
    }
    return lo
  }

  return {
    advance(time) {
      const target = upperBound(time)
      if (target === applied) return { added: [], removed: [] }
      const before = new Set(active)
      // ponytail: a backward seek replays from event 0 (O(n)); add checkpoints if timelines grow far past 20k events.
      if (target < applied) clear()
      apply(applied, target)
      applied = target
      return {
        added: [...active].filter((id) => !before.has(id)),
        removed: [...before].filter((id) => !active.has(id)),
      }
    },
    active: () => active,
    reset: clear,
  }
}
