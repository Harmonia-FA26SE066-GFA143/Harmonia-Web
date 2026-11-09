import { env } from '@/config/env'
import { abortedError, ScoreSourceError, untilAborted, type ScorePackage, type ScorePackageSource } from './types'

/**
 * DEV FIXTURE – không phải API contract. Self-written sample (4 bars, 1 part) and its FluidSynth WAV from the Verovio
 * spike. Only works when `env.useDevFixtures`; the `import.meta.env.DEV` guard keeps both files out of `dist/`.
 */
export class DevFixtureScoreSource implements ScorePackageSource {
  async load(signal?: AbortSignal): Promise<ScorePackage> {
    if (!(import.meta.env.DEV && env.useDevFixtures)) throw new ScoreSourceError('unavailable', 'Bản nhạc mẫu chỉ dùng khi phát triển.')
    if (signal?.aborted) throw abortedError()

    const modules = Promise.all([import('./fixtures/sample.mxl?url'), import('./fixtures/sample.wav?url')]).catch((cause: unknown) => {
      throw new ScoreSourceError('read-failed', 'Không đọc được bản nhạc mẫu.', cause)
    })
    const [{ default: scoreUrl }, { default: audioUrl }] = await untilAborted(modules, signal)
    const read = fetch(scoreUrl, { signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.arrayBuffer()
      })
      .catch((cause: unknown) => {
        if (signal?.aborted) throw abortedError()
        throw new ScoreSourceError('read-failed', 'Không đọc được bản nhạc mẫu.', cause)
      })
    const data = new Uint8Array(await untilAborted(read, signal))

    // Vite asset URLs, not object URLs: nothing to revoke.
    return { score: { data, format: 'mxl', fileName: 'sample.mxl' }, audioUrl, dispose() {} }
  }
}
