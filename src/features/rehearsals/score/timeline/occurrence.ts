/** Slack so a click just after an onset still picks that occurrence (seconds). */
const TOLERANCE = 0.1

/**
 * Picks the onset to seek to when a note repeats: the first one at or after
 * `currentTime - 100ms`, wrapping to the first onset when none remains.
 * `onsets` is ascending (PlaybackTimeline.onsets order).
 */
export function chooseOccurrence(onsets: readonly number[], currentTime: number): number | undefined {
  const threshold = currentTime - TOLERANCE
  return onsets.find((onset) => onset >= threshold) ?? onsets[0]
}
