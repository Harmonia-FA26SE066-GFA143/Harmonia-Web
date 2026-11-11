import { getInteractiveScore, type InteractiveScore } from '@/features/music-library'
import { ApiError } from '@/lib/api/errors'
import { abortedError, ScoreSourceError, untilAborted, type ScorePackage, type ScorePackageSource } from './types'

/** Answers of `GET /api/music-materials/{id}/score` that trying again cannot change (Harmonia-BE d74096c, ErrorStatusMap.cs:105,114,119). */
const unavailableMessages: Record<string, string> = {
  MATERIAL_NOT_FOUND: 'Bản nhạc này không còn trong kho bài hát. Vui lòng chọn tài liệu khác.',
  MATERIAL_NOT_INTERACTIVE_SCORE: 'Tài liệu này không phải bản nhạc tương tác. Vui lòng chọn tài liệu khác.',
  MATERIAL_PLAYBACK_UNAVAILABLE: 'Bản nhạc này chưa có bản phát. Vui lòng thay lại tệp trong kho bài hát.',
}

/** An expired link or a file of another revision: a new answer from the API can cure it, the same links cannot. */
class StaleFilesError extends Error {}

const readFailed = (cause?: unknown) => new ScoreSourceError('read-failed', 'Không tải được bản nhạc. Vui lòng thử lại.', cause)

async function download(url: string, signal?: AbortSignal): Promise<ArrayBuffer> {
  try {
    const response = await fetch(url, { signal })
    if (!response.ok) throw new StaleFilesError(`File request failed with status ${response.status}`)
    return await response.arrayBuffer()
  } catch (error) {
    if (signal?.aborted) throw abortedError()
    if (error instanceof StaleFilesError) throw error
    throw readFailed(error)
  }
}

async function assertHash(bytes: ArrayBuffer, expected: string | null) {
  // crypto.subtle exists only on https and localhost; the deployed site is https.
  if (!expected || !crypto.subtle) return
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))
  const actual = Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('')
  if (actual !== expected) throw new StaleFilesError('File hash differs from the score revision')
}

async function requestScore(materialId: string, signal?: AbortSignal): Promise<InteractiveScore> {
  try {
    return await untilAborted(getInteractiveScore(materialId), signal)
  } catch (error) {
    if (error instanceof ScoreSourceError) throw error
    const message = error instanceof ApiError && error.code ? unavailableMessages[error.code] : undefined
    throw message ? new ScoreSourceError('unavailable', message, error) : readFailed(error)
  }
}

/**
 * The score, WAV and notes.json of one revision, from `GET /api/music-materials/{id}/score`. All three are downloaded
 * and checked against the hashes of that one answer, so the signed links are used once and dropped, and the audio
 * cannot expire while it plays: it is an object URL from then on.
 */
export class ApiScoreSource implements ScorePackageSource {
  private readonly materialId: string

  constructor(materialId: string) {
    this.materialId = materialId
  }

  async load(signal?: AbortSignal): Promise<ScorePackage> {
    try {
      return await this.fetchPackage(signal)
    } catch (error) {
      if (!(error instanceof StaleFilesError)) throw error
    }
    try {
      return await this.fetchPackage(signal)
    } catch (error) {
      throw error instanceof StaleFilesError ? readFailed(error) : error
    }
  }

  private async fetchPackage(signal?: AbortSignal): Promise<ScorePackage> {
    const score = await requestScore(this.materialId, signal)
    const [scoreBytes, audioBytes, notesBytes] = await Promise.all([
      download(score.scoreUrl, signal),
      download(score.audioUrl, signal),
      download(score.notesUrl, signal),
    ])
    await Promise.all([
      assertHash(scoreBytes, score.scoreSha256),
      assertHash(audioBytes, score.audioSha256),
      assertHash(notesBytes, score.notesSha256),
    ])
    if (signal?.aborted) throw abortedError()

    let notesEndSeconds: number
    try {
      ;({ notesEndSeconds } = JSON.parse(new TextDecoder().decode(notesBytes)) as { notesEndSeconds: number })
    } catch (error) {
      throw readFailed(error)
    }

    const audioUrl = URL.createObjectURL(new Blob([audioBytes], { type: 'audio/wav' }))
    let disposed = false
    return {
      score: { format: score.scoreFormat, data: new Uint8Array(scoreBytes), fileName: score.fileName },
      audioUrl,
      notesEndSeconds,
      dispose() {
        if (disposed) return
        disposed = true
        URL.revokeObjectURL(audioUrl)
      },
    }
  }
}
