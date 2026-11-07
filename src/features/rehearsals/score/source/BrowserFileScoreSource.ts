import { abortedError, ScoreSourceError, untilAborted, type ScorePackage, type ScorePackageSource } from './types'

/** Same limit the BE puts on a score upload: `MusicMaterialService.MaxFileSizeBytes` (Harmonia-BE f449a4b, line 31). */
export const SCORE_MAX_BYTES = 20 * 1024 * 1024
/** Web-only limit, no BE rule: 100 MB fits about 10 minutes of 16-bit stereo 44.1 kHz WAV. */
export const AUDIO_MAX_BYTES = 100 * 1024 * 1024

const MB = 1024 * 1024

function scoreFormat(name: string): 'musicxml' | 'mxl' | undefined {
  const lower = name.toLowerCase()
  if (lower.endsWith('.musicxml')) return 'musicxml'
  if (lower.endsWith('.mxl')) return 'mxl'
  return undefined
}

/** A score and its WAV picked by the user. Nothing leaves the browser. */
export class BrowserFileScoreSource implements ScorePackageSource {
  private readonly files: { score: File; audio: File }

  constructor(files: { score: File; audio: File }) {
    this.files = files
  }

  async load(signal?: AbortSignal): Promise<ScorePackage> {
    if (signal?.aborted) throw abortedError()
    const { score, audio } = this.files
    const format = scoreFormat(score.name)
    if (!format) throw new ScoreSourceError('invalid-type', 'Tệp bản nhạc cần có đuôi .musicxml hoặc .mxl. Vui lòng chọn lại tệp.')
    if (!audio.name.toLowerCase().endsWith('.wav')) throw new ScoreSourceError('invalid-type', 'Tệp âm thanh cần có đuôi .wav. Vui lòng chọn lại tệp.')
    if (score.size > SCORE_MAX_BYTES)
      throw new ScoreSourceError('too-large', `Tệp bản nhạc lớn hơn ${SCORE_MAX_BYTES / MB} MB. Vui lòng chọn tệp nhỏ hơn.`)
    if (audio.size > AUDIO_MAX_BYTES)
      throw new ScoreSourceError('too-large', `Tệp âm thanh lớn hơn ${AUDIO_MAX_BYTES / MB} MB. Vui lòng chọn tệp ngắn hơn.`)

    if (signal?.aborted) throw abortedError()
    const read: Promise<string | Uint8Array> = (format === 'mxl' ? score.arrayBuffer().then((buffer) => new Uint8Array(buffer)) : score.text()).catch((cause: unknown) => {
      throw new ScoreSourceError('read-failed', 'Không đọc được tệp bản nhạc. Vui lòng chọn lại tệp.', cause)
    })
    const data = await untilAborted(read, signal)

    // Created only after the read, so an abort or failure never leaves a URL behind.
    const audioUrl = URL.createObjectURL(audio)
    let disposed = false
    return {
      score: { data, format, fileName: score.name },
      audioUrl,
      dispose() {
        if (disposed) return
        disposed = true
        URL.revokeObjectURL(audioUrl)
      },
    }
  }
}
