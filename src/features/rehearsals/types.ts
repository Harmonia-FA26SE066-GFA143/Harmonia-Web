/**
 * A rehearsal of one liturgical program (FE-26). Fields follow the owner decisions of 2026-09-29 and 2026-09-30
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
  location: string
  /** Songs to practise, chosen from the program's approved song list (at least one). */
  songs: RehearsalSong[]
  note?: string
  /**
   * Attendance was recorded for this session, so it cannot be deleted (decision 2026-09-30, 6a.7).
   * TBD: chờ API contract – how the backend reports this.
   */
  hasAttendance?: boolean
}

export interface RehearsalSong {
  songId: string
  title: string
}

export type RehearsalValues = Omit<Rehearsal, 'id' | 'hasAttendance'>

/** Upcoming until the session has ended; the only distinction the UI makes (no stored status). */
export const isUpcoming = (rehearsal: Pick<Rehearsal, 'endAt'>, now = Date.now()) => Date.parse(rehearsal.endAt) >= now

/** Attendance is taken on the day of the session only (decision 2026-09-30, 6a.6). */
export const isRehearsalDay = (rehearsal: Pick<Rehearsal, 'startAt'>, now = new Date()) =>
  new Date(rehearsal.startAt).toDateString() === now.toDateString()
