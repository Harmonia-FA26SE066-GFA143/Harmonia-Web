import type { SongListStatus } from '@/features/liturgical-programs'
import { apiRequest } from '@/lib/api/client'
import { ApiError } from '@/lib/api/errors'
import type { ReviewDecision, SongList, SongListItemInput } from '../types'

// `/api/song-lists` (Harmonia-BE SongListsController), the Choir Director's side: the newest version of an event's
// list (drafts included), a new version, the items of a draft, and the submission.

type ApiStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | 'NeedsRevision'
type ApiDecision = 'Approve' | 'Reject' | 'RequestRevision'

const statusByApi: Record<ApiStatus, SongListStatus> = {
  Draft: 'draft',
  Submitted: 'submitted',
  Approved: 'approved',
  Rejected: 'rejected',
  NeedsRevision: 'needsRevision',
}

const decisionByApi: Record<ApiDecision, ReviewDecision> = {
  Approve: 'approve',
  Reject: 'reject',
  RequestRevision: 'requestRevision',
}

interface SongListDto {
  id: string
  eventId: string
  version: number
  status: ApiStatus
  submittedAt: string | null
  decidedAt: string | null
  items: {
    id: string
    songId: string
    songTitle: string
    slotId: string
    slotName: string
    displayOrder: number
    note: string | null
  }[]
  reviews: { decision: ApiDecision; notes: string | null; reviewedAt: string }[]
}

const toSongList = (dto: SongListDto): SongList => ({
  id: dto.id,
  eventId: dto.eventId,
  version: dto.version,
  status: statusByApi[dto.status],
  submittedAt: dto.submittedAt ?? undefined,
  decidedAt: dto.decidedAt ?? undefined,
  // The backend does not order the items.
  items: dto.items
    .map((item) => ({ ...item, note: item.note ?? undefined }))
    .sort((a, b) => a.displayOrder - b.displayOrder),
  reviews: dto.reviews.map(({ decision, notes, reviewedAt }) => ({
    decision: decisionByApi[decision],
    notes: notes ?? undefined,
    reviewedAt,
  })),
})

const toItems = (items: SongListItemInput[]) =>
  items.map(({ songId, slotId, note }, index) => ({ songId, slotId, displayOrder: index + 1, note: note?.trim() || undefined }))

/** `null` while the event has no list (404 SONG_LIST_NOT_FOUND). */
export async function getSongList(eventId: string): Promise<SongList | null> {
  try {
    return toSongList(await apiRequest<SongListDto>(`/api/song-lists/event/${eventId}/latest`))
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

/**
 * Saves the items as a draft: replaces those of the current draft, or starts a new Draft version when there is no
 * list yet or the newest one was rejected or needs revision.
 */
export async function saveSongList(eventId: string, current: SongList | null, items: SongListItemInput[]): Promise<SongList> {
  if (current?.status === 'draft') {
    return toSongList(
      await apiRequest<SongListDto>(`/api/song-lists/${current.id}/items`, {
        method: 'PUT',
        body: JSON.stringify({ items: toItems(items) }),
      }),
    )
  }
  return toSongList(
    await apiRequest<SongListDto>('/api/song-lists', { method: 'POST', body: JSON.stringify({ eventId, items: toItems(items) }) }),
  )
}

/** Draft → Submitted; the Parish Priests are notified. */
export async function submitSongList(id: string): Promise<void> {
  await apiRequest<unknown>(`/api/song-lists/${id}/submit`, { method: 'POST' })
}
