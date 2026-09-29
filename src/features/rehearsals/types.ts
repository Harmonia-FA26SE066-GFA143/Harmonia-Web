/**
 * A rehearsal of one liturgical program (FE-26). Fields follow the owner decision of 2026-09-29
 * (rehearsal-attendance.md, DECIDED): no rehearsal status and no recurrence; a service-preparation session is
 * created as a rehearsal. TBD: Backend API missing – identifiers and field names come with the contract.
 */
export interface Rehearsal {
  id: string
  programId: string
  name: string
  /** ISO date-time. */
  startAt: string
  /** ISO date-time, after `startAt`. */
  endAt: string
  location?: string
  /** Songs to practise, chosen from the program's song list. */
  songs: RehearsalSong[]
  note?: string
}

export interface RehearsalSong {
  songId: string
  title: string
}

export type RehearsalValues = Omit<Rehearsal, 'id'>

/** Upcoming until the session has ended; the only distinction the UI makes (no stored status). */
export const isUpcoming = (rehearsal: Pick<Rehearsal, 'endAt'>, now = Date.now()) => Date.parse(rehearsal.endAt) >= now
