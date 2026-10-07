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
 * The Choir Director can edit the song list except while it waits for review and after approval
 * (owner decision 2026-09-28, song-approval.md DECIDED).
 */
export function canEditSongList(status?: SongListStatus): boolean {
  return status !== 'submitted' && status !== 'approved'
}

/**
 * A program as the Choir Director pages and the song-list pages use it: an event together with its song list.
 * TBD: Backend API missing – song lists have no controller yet, so these pages stay on dev fixtures. The Priest
 * pages use `LiturgicalEvent` (below), which follows `/api/liturgical-events`.
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
  /** Songs of the current song list, in order. Per-song review decisions are shown on the song-list pages. */
  songs: ProgramSong[]
}


export interface ProgramFilters {
  search: string
  seasonId?: string
  massTypeId?: string
  ceremonyTypeId?: string
}

/** `EventStatus` of Harmonia-BE (decision D3, 2026-10-07): Draft → Published, either may become Cancelled. */
export type EventStatus = 'draft' | 'published' | 'cancelled'

export const eventStatusLabels: Record<EventStatus, string> = {
  draft: 'Bản nháp',
  published: 'Đã công bố',
  cancelled: 'Đã hủy',
}

/**
 * A liturgical event as the Priest manages it: `LiturgicalEventDto` of `/api/liturgical-events` (Harmonia-BE).
 * Catalog entries arrive as ids; their names come from the lookups.
 */
export interface LiturgicalEvent {
  id: string
  /** Calendar date in Vietnam, YYYY-MM-DD. */
  date: string
  /** Local time, HH:mm. */
  time: string
  title?: string
  locationId: string
  locationName: string
  seasonId?: string
  massTypeId?: string
  ceremonyTypeId?: string
  categoryId?: string
  specialRequirements?: string
  status: EventStatus
  /** UTC timestamp; read with `parseUtc`. */
  publishedAt?: string
}

/**
 * Body of POST and PUT /api/liturgical-events (Create/UpdateLiturgicalEventRequestValidator): date, time and
 * location required, a Mass type or a ceremony type required, title ≤ 200, special requirements ≤ 1000.
 */
export interface EventFormValues {
  date: string
  time: string
  locationId: string
  seasonId?: string
  massTypeId?: string
  ceremonyTypeId?: string
  categoryId?: string
  title?: string
  specialRequirements?: string
}

/** Query filters of GET /api/liturgical-events; they combine with AND on the server. */
export interface EventFilters {
  status?: EventStatus
  /** YYYY-MM-DD, inclusive. */
  fromDate?: string
  toDate?: string
}
