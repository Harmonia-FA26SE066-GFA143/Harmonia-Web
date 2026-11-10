import { useEffect } from 'react'
import type { PlaybackClock } from '../clock/usePlaybackClock'
import type { TimelineCursor } from '../timeline/cursor'

export const ACTIVE_NOTE_CLASS = 'hm-score-note--active'

export type ScoreSyncClock = Pick<PlaybackClock, 'subscribe' | 'getTime'>

/**
 * Lights the sounding notes straight on the viewer's SVG: time goes clock → cursor → classList, never through React state.
 * The viewer replaces its DOM whenever filtered pages arrive (first show, relayout), so the sheet is watched for new
 * children and the current notes are lit again. A class change is an attribute mutation and does not wake the observer.
 * An id the sheet does not have is skipped; repeat ids arrive already mapped to their original by `parseTimemap`.
 */
export function useScoreSync(clock: ScoreSyncClock, viewerRoot: HTMLElement | null, cursor: TimelineCursor | null) {
  const { subscribe, getTime } = clock

  useEffect(() => {
    if (!viewerRoot || !cursor) return

    // Looked up inside this root only: ids come from an uploaded file and could match something else in the document.
    const indexNotes = () => new Map(Array.from(viewerRoot.querySelectorAll('g.note[id]'), (element) => [element.id, element]))
    let notes = indexNotes()
    const mark = (ids: Iterable<string>, active: boolean) => {
      for (const id of ids) notes.get(id)?.classList.toggle(ACTIVE_NOTE_CLASS, active)
    }
    const moveTo = (time: number) => {
      const { added, removed } = cursor.advance(time)
      mark(removed, false)
      mark(added, true)
    }

    const observer = new MutationObserver(() => {
      notes = indexNotes()
      mark(cursor.active(), true)
    })
    observer.observe(viewerRoot, { childList: true, subtree: true })

    moveTo(getTime())
    const unsubscribe = subscribe(moveTo)

    return () => {
      unsubscribe()
      observer.disconnect()
      mark(cursor.active(), false)
      cursor.reset() // the next run (StrictMode, a new root) starts from nothing lit
    }
  }, [cursor, getTime, subscribe, viewerRoot])
}
