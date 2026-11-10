import { useEffect } from 'react'
import type { ActiveSyllableIndex } from '../lyrics'
import type { ScoreSyncClock } from './useScoreSync'
import type { PlaybackClock } from '../clock/usePlaybackClock'

/**
 * At the end of the audio the index is read this much earlier. Spans are `[start, end)`, so an audio ending exactly at the
 * last syllable's end would otherwise go dark on the very last frame. Timeline times are whole milliseconds.
 */
export const END_HOLD_SECONDS = 0.001

export type LyricSyncClock = ScoreSyncClock & Pick<PlaybackClock, 'duration'>

/** Styled in ScoreViewer.css, next to `hm-score-note--active`. */
export const ACTIVE_LYRIC_CLASS = 'hm-score-lyric--active'

/**
 * Lights the syllables being sung on the viewer's SVG, the same way `useScoreSync` lights notes: clock → `index.at` →
 * classList, never through React state. Verovio draws each `<syl>` as `g.syl` with the MEI `xml:id` as its id (checked on
 * 6.4.1, see the slice 2B report). The index returns the same array for the same set, so the DOM is touched only when the
 * set changes. A new index (another part or verse) re-runs the effect: the old syllables go dark, the new ones light at
 * the current time.
 *
 * End of the song: at a time at or past the audio's `duration` the index is read `END_HOLD_SECONDS` earlier, so the syllable
 * sung up to the last sample stays lit when playback ends (the clock emits a last frame at `duration`, then nothing). An
 * audio longer than the score (a reverb tail) is not changed by this: just before its end nothing is sung, so nothing lights.
 */
export function useLyricSync(clock: LyricSyncClock, viewerRoot: HTMLElement | null, index: ActiveSyllableIndex | null) {
  const { subscribe, getTime, duration } = clock

  useEffect(() => {
    if (!viewerRoot || !index) return

    // Looked up inside this root only: ids come from an uploaded file and could match something else in the document.
    const indexSyllables = () => new Map(Array.from(viewerRoot.querySelectorAll('g.syl[id]'), (element) => [element.id, element]))
    let syllables = indexSyllables()
    let lit: readonly string[] = []
    const mark = (ids: readonly string[], active: boolean) => {
      for (const id of ids) syllables.get(id)?.classList.toggle(ACTIVE_LYRIC_CLASS, active)
    }
    const moveTo = (time: number) => {
      const next = index.at(duration > 0 && time >= duration ? duration - END_HOLD_SECONDS : time)
      if (next === lit) return
      mark(lit, false)
      mark(next, true)
      lit = next
    }

    const observer = new MutationObserver(() => {
      syllables = indexSyllables()
      mark(lit, true)
    })
    observer.observe(viewerRoot, { childList: true, subtree: true })

    moveTo(getTime())
    const unsubscribe = subscribe(moveTo)

    return () => {
      unsubscribe()
      observer.disconnect()
      mark(lit, false)
    }
  }, [duration, getTime, index, subscribe, viewerRoot])
}
