import type { SongListStatus } from '@/features/liturgical-programs'

/**
 * The Priest's decision on a submitted list (`ReviewDecision` of Harmonia-BE): one decision and one note for the
 * whole list. This supersedes the per-song review of song-approval.md (2026-09-28); owner decision 2026-10-07:
 * follow the BE.
 */
export type ReviewDecision = 'approve' | 'requestRevision' | 'reject'

/** One song of a list (`SongListItemDto`). */
export interface SongListItem {
  id: string
  songId: string
  songTitle: string
  /** Liturgical slot (Ca nhập lễ, Đáp ca…); each slot holds one song of the list. */
  slotId: string
  slotName: string
  displayOrder: number
  /** The Choir Director's note on this song, shown to the Priest. */
  note?: string
}

export interface SongListReview {
  decision: ReviewDecision
  notes?: string
  /** Backend `DateTime`; read it with `parseUtc`. */
  reviewedAt: string
}

/**
 * One version of an event's song list (`SongListDto`). The Choir Director edits a Draft; a rejected list or one that
 * needs revision is followed by a new Draft version (SongListService.CreateAsync).
 */
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

/** A song as the Choir Director saves it; the order of the array is the display order. */
export interface SongListItemInput {
  songId: string
  slotId: string
  note?: string
}

/**
 * A library song proposed for an event (`SongSuggestionResponse`, BE d1ca63e), best first. The score is 3 for the
 * slot, 2 for the Mass or ceremony type, 2 for the season; a song classified only under another season or slot is
 * left out, and a song with no classification at all is never proposed.
 */
export interface SongSuggestion {
  songId: string
  title: string
  composer?: string
  score: number
  matchesSlot: boolean
  matchesEventType: boolean
  matchesSeason: boolean
  /** Past published programs whose approved list had the song. */
  timesUsed: number
  /** YYYY-MM-DD; absent when never sung. */
  lastUsedDate?: string
}
