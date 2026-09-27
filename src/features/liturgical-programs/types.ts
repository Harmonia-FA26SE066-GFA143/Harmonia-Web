import type { CatalogItem } from '@/features/system-categories'

/** Reference to an FE-50 catalog entry as shown on a program. */
export type CatalogRef = Pick<CatalogItem, 'id' | 'name'>

/**
 * Conceptual song-list conditions derived from Report 1 FE-17–FE-18 and FE-30–FE-32 (song-approval.md,
 * INTERPRETATION). They are display labels only: official status values and transitions are UNRESOLVED.
 * Declared once here so the Choir Director pages (Phase 5) reuse the same wording.
 */
export type SongListStatus = 'submitted' | 'approved' | 'rejected' | 'revisionRequested'

export const songListStatusLabels: Record<SongListStatus, string> = {
  submitted: 'Chờ xem xét',
  approved: 'Đã phê duyệt',
  rejected: 'Bị từ chối',
  revisionRequested: 'Yêu cầu chỉnh sửa',
}

/**
 * A liturgical program with the FE-16 event fields. Treating one program as one event is an interpretation:
 * how weekly programs (FE-15) group events is UNRESOLVED. No Draft/Published state (not decided).
 * TBD: Backend API missing – identifiers and field names come with the contract.
 */
export interface LiturgicalProgram {
  id: string
  eventName: string
  /** Celebration date as YYYY-MM-DD. */
  date: string
  season?: CatalogRef
  massType?: CatalogRef
  ceremonyType?: CatalogRef
  specialRequirements?: string
  /** Absent until the Choir Director submits a song list. */
  songListStatus?: SongListStatus
}

export interface ProgramSong {
  id: string
  /** Liturgical part (e.g. entrance, offertory); free text until the contract defines it. */
  liturgicalPart?: string
  title: string
}

export interface LiturgicalProgramDetail extends LiturgicalProgram {
  /** Songs of the current song list, in order. Per-song review decisions are UNRESOLVED and not shown. */
  songs: ProgramSong[]
}

/** FE-16 fields entered by the Priest. Requiredness and validation rules are UNRESOLVED (TBD). */
export interface ProgramFormValues {
  eventName: string
  /** YYYY-MM-DD. */
  date: string
  seasonId?: string
  massTypeId?: string
  ceremonyTypeId?: string
  specialRequirements?: string
}

export interface ProgramFilters {
  search: string
  seasonId?: string
  massTypeId?: string
  ceremonyTypeId?: string
}
