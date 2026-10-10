import type { SongListStatus } from '@/features/liturgical-programs'

/**
 * The Priest's decision on a submitted list (`ReviewDecision` of Harmonia-BE): one decision for the whole list with
 * one note. This supersedes the per-song review of song-approval.md (2026-09-28) and the per-song comments and
 * rejection-reason list of 2026-10-01 (owner decision 2026-10-07: follow the BE).
 */
export type ReviewDecision = 'approve' | 'requestRevision' | 'reject'

export const reviewDecisionLabels: Record<ReviewDecision, string> = {
  approve: 'Phê duyệt',
  requestRevision: 'Yêu cầu chỉnh sửa',
  reject: 'Từ chối',
}

/** Body of POST /api/song-lists/{id}/review: notes required unless approving, ≤ 1000. */
export interface ReviewValues {
  decision: ReviewDecision
  notes?: string
}

/** One song of a list (`SongListItemDto`). */
export interface SongListItem {
  id: string
  songTitle: string
  /** Liturgical slot (Ca nhập lễ, Đáp ca…). */
  slotName: string
  displayOrder: number
  /** The Choir Director's note on this song. */
  note?: string
}

export interface SongListReview {
  id: string
  decision: ReviewDecision
  notes?: string
  /** Backend `DateTime`; read it with `parseUtc`. */
  reviewedAt: string
}

/** One version of an event's song list (`SongListDto`); a new version follows a rejection or a revision request. */
export interface SongList {
  id: string
  eventId: string
  version: number
  status: SongListStatus
  /** Backend `DateTime`s; read them with `parseUtc`. */
  submittedAt?: string
  decidedAt?: string
  /** In display order. */
  items: SongListItem[]
  reviews: SongListReview[]
}
