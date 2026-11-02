import type { SongListStatus } from '@/features/liturgical-programs'
import { apiRequest, orNullOn404 } from '@/lib/api/client'
import type { ReviewDecision, ReviewValues, SongList } from '../types'

// `/api/song-lists` (Harmonia-BE SongListsController), the Parish Priest's side: lists waiting for review, the newest
// list of an event that is not a draft, one version by id, and the decision.

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
  previousVersionId: string | null
  status: ApiStatus
  submittedAt: string | null
  decidedAt: string | null
  items: { id: string; songId: string; songTitle: string; slotName: string; displayOrder: number; note: string | null }[]
  reviews: { id: string; decision: ApiDecision; notes: string | null; reviewedAt: string }[]
}

const toSongList = (dto: SongListDto): SongList => ({
  id: dto.id,
  eventId: dto.eventId,
  version: dto.version,
  previousVersionId: dto.previousVersionId ?? undefined,
  status: statusByApi[dto.status],
  submittedAt: dto.submittedAt ?? undefined,
  decidedAt: dto.decidedAt ?? undefined,
  // The backend does not order the items.
  items: dto.items
    .map(({ id, songId, songTitle, slotName, displayOrder, note }) => ({ id, songId, songTitle, slotName, displayOrder, note: note ?? undefined }))
    .sort((a, b) => a.displayOrder - b.displayOrder),
  reviews: dto.reviews.map(({ id, decision, notes, reviewedAt }) => ({
    id,
    decision: decisionByApi[decision],
    notes: notes ?? undefined,
    reviewedAt,
  })),
})

/** Every submitted list, oldest submission first; their `items` are empty. */
export async function listPendingSongLists(): Promise<SongList[]> {
  return (await apiRequest<SongListDto[]>('/api/song-lists/pending')).map(toSongList)
}

/**
 * The newest version of the event's list that is not a draft (the Choir Director's drafts stay theirs); `null` while
 * there is none (404 SONG_LIST_NOT_FOUND).
 */
export async function getLatestSongList(eventId: string): Promise<SongList | null> {
  const dto = await orNullOn404(apiRequest<SongListDto>(`/api/song-lists/event/${eventId}/latest`))
  return dto && toSongList(dto)
}

/**
 * Every version of the event's list with its items and decisions, newest first (BE 90af733,
 * `GET /api/song-lists/event/{eventId}/versions`); the Parish Priest does not see drafts.
 */
export async function listSongListVersions(eventId: string): Promise<SongList[]> {
  return (await apiRequest<SongListDto[]>(`/api/song-lists/event/${eventId}/versions`)).map(toSongList)
}

/** The Choir Director who proposed the list is notified of the decision. */
export async function reviewSongList(id: string, { decision, notes }: ReviewValues): Promise<void> {
  await apiRequest<unknown>(`/api/song-lists/${id}/review`, {
    method: 'POST',
    body: JSON.stringify({ decision: apiDecision[decision], notes }),
  })
}
