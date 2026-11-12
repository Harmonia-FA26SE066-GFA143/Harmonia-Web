import { sessionDraftPrefix } from '@/lib/auth/session'

// An AI-extracted lyrics draft waits here, in this tab, until the Director opens and saves it. The server keeps the job
// result for 24 hours (lyricsExtraction.ts picks it up again after a reload). Signing out clears the prefix.
const ttlMs = 2 * 60 * 60 * 1000
const keyOf = (songId: string, materialId: string) => `${sessionDraftPrefix}lyrics.${songId}.${materialId}`

export function saveLyricsDraft(songId: string, materialId: string, text: string) {
  try {
    sessionStorage.setItem(keyOf(songId, materialId), JSON.stringify({ text, expiresAt: Date.now() + ttlMs }))
  } catch {
    // Storage full or blocked: the notification still says the text was read; the Director can run it again.
  }
}

/** The draft text, or undefined when there is none or it is older than two hours (then it is removed). */
export function readLyricsDraft(songId: string, materialId: string): string | undefined {
  try {
    const stored = sessionStorage.getItem(keyOf(songId, materialId))
    if (!stored) return undefined
    const { text, expiresAt } = JSON.parse(stored) as { text: string; expiresAt: number }
    if (Date.now() < expiresAt) return text
    sessionStorage.removeItem(keyOf(songId, materialId))
  } catch {
    // Unreadable: treat as no draft.
  }
  return undefined
}

export function removeLyricsDraft(songId: string, materialId: string) {
  try {
    sessionStorage.removeItem(keyOf(songId, materialId))
  } catch {
    // Nothing to remove.
  }
}
