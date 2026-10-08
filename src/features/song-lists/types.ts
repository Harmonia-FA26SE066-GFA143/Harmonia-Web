import type { SongListStatus } from '@/features/liturgical-programs'

/** Per-song review decision (owner decision 2026-09-28, song-approval.md DECIDED). */
export type SongReviewDecision = 'accepted' | 'revisionRequested'

export const songReviewDecisionLabels: Record<SongReviewDecision, string> = {
  accepted: 'Chấp thuận',
  revisionRequested: 'Cần chỉnh sửa',
}

export interface SongReview {
  decision: SongReviewDecision
  /** Required when revision is requested. */
  note?: string
}

/** One song of a program's song list. */
export interface SongListItem {
  id: string
  /** Song of the music library. */
  songId: string
  title: string
  /**
   * Name of a liturgical slot (`GET /api/lookups/liturgical-slots`, e.g. Ca nhập lễ). The backend stores
   * `SongListItem.SlotId`; the name is kept until song lists have a controller.
   */
  liturgicalPart?: string
  /**
   * Choir Director's note on this song, shown to the Priest. Follows the Stitch screens; not stated in Report 1
   * or the 2026-09-28 decisions (TBD: owner to confirm).
   */
  directorNote?: string
  /** Latest review of this song, absent until the Priest decides. */
  review?: SongReview
}

/**
 * The song list of one liturgical program (FE-17–FE-20, FE-30–FE-32).
 * TBD: Backend API missing – field names, persisted status values and history come with the contract.
 */
export interface SongList {
  programId: string
  /** Absent until the Choir Director submits a list. */
  status?: SongListStatus
  items: SongListItem[]
  /** ISO 8601 timestamps. */
  submittedAt?: string
  reviewedAt?: string
  /** General note from the Priest; required when the whole list is rejected. */
  priestNote?: string
}

/** A song as the Choir Director submits it. */
export interface SongListItemInput {
  songId: string
  title: string
  liturgicalPart?: string
  directorNote?: string
}

