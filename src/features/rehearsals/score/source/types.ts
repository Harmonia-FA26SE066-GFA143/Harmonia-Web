/** Raw files for the player: the score text/bytes and a URL the `<audio>` element can play. */
export interface ScorePackage {
  /** `mxl` is the zipped MusicXML container, so it is always bytes. */
  score: { data: string | Uint8Array; format: 'musicxml' | 'mxl'; fileName: string }
  audioUrl: string
  /** Revokes every object URL this package created. Safe to call more than once. */
  dispose(): void
}

export interface ScorePackageSource {
  load(signal?: AbortSignal): Promise<ScorePackage>
}

export type ScoreSourceErrorCode = 'invalid-type' | 'too-large' | 'read-failed' | 'aborted' | 'unavailable'

/** The only error a source throws. `message` is Vietnamese UI copy; the underlying error stays in `cause`. */
export class ScoreSourceError extends Error {
  readonly code: ScoreSourceErrorCode

  constructor(code: ScoreSourceErrorCode, message: string, cause?: unknown) {
    super(message, { cause })
    this.name = 'ScoreSourceError'
    this.code = code
  }
}

export const abortedError = () => new ScoreSourceError('aborted', 'Đã huỷ việc mở bản nhạc.')

/** Settles with `work`, or rejects with `aborted` as soon as `signal` fires. */
export function untilAborted<T>(work: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return work
  if (signal.aborted) return Promise.reject(abortedError())
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(abortedError())
    signal.addEventListener('abort', onAbort, { once: true })
    work.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort))
  })
}
