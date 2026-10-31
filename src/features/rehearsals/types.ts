/**
 * A rehearsal or service-preparation session (`RehearsalDto` of Harmonia-BE, FE-26). It has no name and no status;
 * the program and the location are optional. This supersedes the required name, location and songs of the owner
 * decisions of 2026-09-29 and 2026-09-30 (owner decision 2026-10-07: follow the BE).
 */
export interface Rehearsal {
  id: string
  /** The choir holding it (D8); absent on sessions made before choirs had directors. Set on creation only. */
  choirId?: string
  /** The liturgical program it prepares, if any. */
  eventId?: string
  /** A worship location of the catalog. */
  locationId?: string
  locationName?: string
  /** Backend `DateTime`s; read them with `parseUtc`. */
  startAt: string
  endAt: string
  note?: string
  /** Songs to practise, in order. */
  songs: RehearsalSong[]
}

export interface RehearsalSong {
  songId: string
  songTitle: string
  /** What to work on in this song (≤ 500, UpdateRehearsalSongRequestValidator). */
  note?: string
}

export type RehearsalValues = Omit<Rehearsal, 'id' | 'locationName'>

/** Filters of GET /api/rehearsals; the dates apply to the start, as YYYY-MM-DD. */
export interface RehearsalFilters {
  eventId?: string
  fromDate?: string
  toDate?: string
}

/** Upcoming until the session has ended; the backend refuses to edit it afterwards (REHEARSAL_ALREADY_PASSED). */
export const isUpcoming = (rehearsal: Pick<Rehearsal, 'endAt'>, now = Date.now()) => Date.parse(rehearsal.endAt) >= now

export const isRehearsalDay = (rehearsal: Pick<Rehearsal, 'startAt'>, now = new Date()) =>
  new Date(rehearsal.startAt).toDateString() === now.toDateString()
