import { env } from '@/config/env'
import { ApiContractMissingError } from '@/lib/api/errors'
import type { SongList, SongListItemInput } from '../types'

// TBD: Backend API missing – the Choir Director's side of song lists (FE-30–FE-32); the Priest's review uses the
// backend (song-list-review feature).
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
