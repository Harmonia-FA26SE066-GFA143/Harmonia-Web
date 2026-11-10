/**
 * Which onset a click on a repeated note jumps to: the one nearest in time to `currentTime` (smallest absolute
 * distance), the earlier one on a tie so the passage plays again.
 * This is "nearest in time", not "the pass being listened to": with `[10, 30]` at 25 s it picks 30 even if the singer is
 * still in the first pass, and at 20 s (a tie) it picks 10. The sheet draws a repeated note once, so nothing else says
 * which pass the click was meant for.
 */
export function nearestOccurrence(onsets: readonly number[], currentTime: number): number | undefined {
  let best: number | undefined
  for (const onset of onsets) {
    if (best === undefined) best = onset
    else {
      const distance = Math.abs(onset - currentTime)
      const bestDistance = Math.abs(best - currentTime)
      if (distance < bestDistance || (distance === bestDistance && onset < best)) best = onset
    }
  }
  return best
}
