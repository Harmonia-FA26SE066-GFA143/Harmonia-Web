import type { SongListStatus } from '@/features/liturgical-programs'
import { apiRequest } from '@/lib/api/client'
import { ApiError } from '@/lib/api/errors'
import type { ReviewDecision, ReviewValues, SongList } from '../types'

// `/api/song-lists` (Harmonia-BE SongListsController), the Parish Priest's side: lists waiting for review, one list,
// the approved list of an event, and the decision. There is no read of an event's current list by event while it is
// a draft, needs revision or was rejected (tbd-backlog B14).

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

const apiDecision = Object.fromEntries(Object.entries(decisionByApi).map(([api, decision]) => [decision, api])) as Record<
  ReviewDecision,
  ApiDecision
>

interface SongListDto {
  id: string
  eventId: string
  version: number
  status: ApiStatus
  submittedAt: string | null
  decidedAt: string | null
  items: { id: string; songTitle: string; slotName: string; displayOrder: number; note: string | null }[]
  reviews: { id: string; decision: ApiDecision; notes: string | null; reviewedAt: string }[]
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
    .map(({ id, songTitle, slotName, displayOrder, note }) => ({ id, songTitle, slotName, displayOrder, note: note ?? undefined }))
    .sort((a, b) => a.displayOrder - b.displayOrder),
  reviews: dto.reviews.map(({ id, decision, notes, reviewedAt }) => ({
    id,
    decision: decisionByApi[decision],
    notes: notes ?? undefined,
    reviewedAt,
  })),
})

/** Every submitted list, oldest submission first. Their `items` are empty: open one with `getSongList`. */
export async function listPendingSongLists(): Promise<SongList[]> {
  return (await apiRequest<SongListDto[]>('/api/song-lists/pending')).map(toSongList)
}

export async function getSongList(id: string): Promise<SongList> {
  return toSongList(await apiRequest<SongListDto>(`/api/song-lists/${id}`))
}

/** `null` while the event has no approved list (404 SONG_LIST_NOT_FOUND, also for an unpublished event). */
export async function getApprovedSongList(eventId: string): Promise<SongList | null> {
  try {
    return toSongList(await apiRequest<SongListDto>(`/api/song-lists/event/${eventId}/approved`))
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

/** The Choir Director who proposed the list is notified of the decision. */
export async function reviewSongList(id: string, { decision, notes }: ReviewValues): Promise<void> {
  await apiRequest<unknown>(`/api/song-lists/${id}/review`, {
    method: 'POST',
    body: JSON.stringify({ decision: apiDecision[decision], notes }),
  })
}
