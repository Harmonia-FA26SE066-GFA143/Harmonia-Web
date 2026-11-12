import { generatePath } from 'react-router'
import { paths } from '@/app/router/paths'
import { ApiError } from '@/lib/api/errors'
import { sessionDraftPrefix } from '@/lib/auth/session'
import type { TaskSpec } from '@/shared/tasks/BackgroundTasks'
import { getLyricsExtraction, startLyricsExtraction, type LyricsExtractionJob } from './api/songsApi'
import { saveLyricsDraft } from './lyricsDraft'
import { extractLyricsErrorMessage } from './songErrors'
import type { SongMaterial } from './types'

// AI lyrics extraction as a server job (Harmonia-BE 6c10d65, MusicMaterialsController.cs:122-140): started once, polled
// until it ends, kept 24 hours. A reload or a closed tab loses nothing: the song page picks the job up again.

export const extractKeyPrefix = 'extract-lyrics:'
const pollMs = 3000
/** The server runs one job at a time and may be waking up; after this the page says to come back later. */
const giveUpMs = 15 * 60 * 1000
const seenKey = `${sessionDraftPrefix}lyrics-jobs-seen`

/** The job ended while nobody was polling it any more. */
export class LyricsExtractionPending extends Error {
  constructor() {
    super('Lyrics extraction still running')
    this.name = 'LyricsExtractionPending'
  }
}

export const isOpenJob = ({ status }: LyricsExtractionJob) => status === 'Queued' || status === 'Running'

/** Jobs whose result this tab already handed over, so reopening the page does not offer the same draft again. */
export function wasSeen(jobId: string): boolean {
  try {
    return (JSON.parse(sessionStorage.getItem(seenKey) ?? '[]') as string[]).includes(jobId)
  } catch {
    return false
  }
}

function markSeen(jobId: string) {
  try {
    const seen = JSON.parse(sessionStorage.getItem(seenKey) ?? '[]') as string[]
    sessionStorage.setItem(seenKey, JSON.stringify([...seen.slice(-49), jobId]))
  } catch {
    // Storage blocked: the draft may be offered once more after a reload.
  }
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Starts a job (the server hands back the one already running for this sheet, so this never pays twice) or follows
 * `jobId`, and resolves with the text once it succeeds. A failed job throws its `errorCode` as an ApiError.
 */
export async function runLyricsExtraction(materialId: string, isCurrent: () => boolean, jobId?: string): Promise<string> {
  const deadline = Date.now() + giveUpMs
  // One poll after another: each waits for the previous answer, so the server is never asked twice at once.
  const follow = async (current: LyricsExtractionJob): Promise<LyricsExtractionJob> => {
    if (!isOpenJob(current)) return current
    if (!isCurrent()) throw new Error('Session ended')
    if (Date.now() > deadline) throw new LyricsExtractionPending()
    await wait(pollMs)
    return follow(await getLyricsExtraction(materialId, current.id))
  }
  const job = await follow(jobId ? await getLyricsExtraction(materialId, jobId) : await startLyricsExtraction(materialId))
  if (isCurrent()) markSeen(job.id)
  if (job.status === 'Failed') throw new ApiError(422, { code: job.errorCode ?? 'INTERNAL_ERROR' })
  return job.lyricsText ?? ''
}

/** The background task of one sheet: shown in the task centre, ends with a link to the draft. */
export function lyricsExtractionTask(songId: string, songTitle: string, material: SongMaterial, jobId?: string): TaskSpec {
  const songPath = generatePath(paths.director.songDetail, { songId })
  return {
    type: 'extract-lyrics',
    key: `${extractKeyPrefix}${material.id}`,
    title: `Trích lời từ ${material.title}`,
    sourcePath: `${songPath}?tab=materials`,
    errorMessage: (error) =>
      error instanceof LyricsExtractionPending
        ? 'Máy chủ vẫn đang trích lời. Vui lòng mở lại trang bài hát sau ít phút để nhận kết quả.'
        : extractLyricsErrorMessage(error),
    run: async (isCurrent) => {
      const text = await runLyricsExtraction(material.id, isCurrent, jobId)
      // A sheet with no printed lyrics answers an empty text, so there is nothing to open.
      if (!text.trim()) return { summary: `Không tìm thấy lời trên “${material.title}”. Bạn có thể gõ lời trực tiếp.` }
      if (isCurrent()) saveLyricsDraft(songId, material.id, text)
      return {
        summary: `Đã trích lời từ ${material.title} của bài ${songTitle}.`,
        action: { label: 'Mở bản nháp', to: `${songPath}?tab=materials&draft=${material.id}` },
      }
    },
  }
}
