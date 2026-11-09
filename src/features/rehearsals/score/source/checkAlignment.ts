/**
 * Whether the WAV and the score timeline last the same, give or take `toleranceSeconds`. `deltaSeconds` is audio minus
 * timeline. Invalid input (negative, NaN, infinite) is never ok. The API source's 2 s WAV tail is its own concern.
 */
export function checkAlignment(audioDurationSeconds: number, timelineDurationSeconds: number, toleranceSeconds = 0.5) {
  const deltaSeconds = audioDurationSeconds - timelineDurationSeconds
  const valid = [audioDurationSeconds, timelineDurationSeconds, toleranceSeconds].every((value) => Number.isFinite(value) && value >= 0)
  return { ok: valid && Math.abs(deltaSeconds) <= toleranceSeconds, deltaSeconds }
}
