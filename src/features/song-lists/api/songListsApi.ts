import { env } from '@/config/env'
import { ApiContractMissingError } from '@/lib/api/errors'
import type { SongList, SongListItemInput, SongReview } from '../types'

// TBD: Backend API missing – song lists of liturgical programs: proposal (FE-30–FE-32) and review (FE-17–FE-20).
// Decision 0002: no endpoint is guessed. Each function checks `import.meta.env.DEV` at the call site so the
// fixture import is dropped from dist/.

/** The program's current song list; `items` is empty and `status` absent when none was proposed. */
export async function getSongList(programId: string): Promise<SongList> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { getSongListFixture } = await import('./fixtures.dev')
    return getSongListFixture(programId)
  }
  throw new ApiContractMissingError('Xem danh sách bài hát của chương trình')
}

/** Choir Director submits (or resubmits) the list for review. */
export async function submitSongList(programId: string, items: SongListItemInput[]): Promise<SongList> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { submitSongListFixture } = await import('./fixtures.dev')
    return submitSongListFixture(programId, items)
  }
  throw new ApiContractMissingError('Gửi duyệt danh sách bài hát')
}

/**
 * Priest submits per-song decisions. The resulting list status (approved when all songs are accepted,
 * revision requested otherwise) follows the owner decision of 2026-09-28; the backend is authoritative.
 */
export async function submitSongReview(
  programId: string,
  review: { decisions: Record<string, SongReview>; note?: string },
): Promise<SongList> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { submitSongReviewFixture } = await import('./fixtures.dev')
    return submitSongReviewFixture(programId, review)
  }
  throw new ApiContractMissingError('Gửi quyết định duyệt danh sách bài hát')
}

/** Priest rejects the whole list with a required note. */
export async function rejectSongList(programId: string, note: string): Promise<SongList> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { rejectSongListFixture } = await import('./fixtures.dev')
    return rejectSongListFixture(programId, note)
  }
  throw new ApiContractMissingError('Từ chối danh sách bài hát')
}
