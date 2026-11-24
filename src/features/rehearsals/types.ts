/**
 * A rehearsal or service-preparation session (`RehearsalDto` of Harmonia-BE, FE-26). It has no name and no status;
 * the program and the location are optional. This supersedes the required name, location and songs of the owner
 * decisions of 2026-09-29 and 2026-09-30 (owner decision 2026-10-07: follow the BE).
 */
export interface Rehearsal {
  id: string
  /** The choir holding it (D8); absent on sessions made before choirs had directors, and on a joint one. Set on creation only. */
  choirId?: string
  /** The liturgical program it prepares, if any. */
  eventId?: string
  /**
   * A joint rehearsal of every choir serving the program (BE 69c9d47, `CreateRehearsalRequest.IsJoint`): it has no choir,
   * needs a program, only the lead choir's director plans it, and its program cannot change (REHEARSAL_JOINT_EVENT_LOCKED).
   */
  isJoint?: boolean
  /** A worship location of the catalog. */
  locationId?: string
  locationName?: string
  /** Backend `DateTime`s; read them with `parseUtc`. */
  startAt: string
  endAt: string
  note?: string
  /** Songs to practise, in order. */
  songs: RehearsalSong[]
  /**
   * The caller may change it and record its attendance (RehearsalDto.cs `CanManage`): false on a joint rehearsal whose
   * program another choir leads. Absent on a session the Web built itself.
   */
  canManage?: boolean
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

/**
 * Attendance can be recorded: the session is today or already held. The backend accepts a record any time after the
 * sheet opens (RehearsalAttendanceService), also days later; before that day the sheet is only read.
 */
export const canTakeAttendance = (rehearsal: Pick<Rehearsal, 'startAt'>, now = new Date()) =>
  isRehearsalDay(rehearsal, now) || Date.parse(rehearsal.startAt) <= now.getTime()

/** A take recorded in the practice room (`RehearsalRecordingDto`, BE 90af733, B43); members of the choir listen on mobile. */
export interface RehearsalRecording {
  id: string
  /** Absent for a take of the whole session. */
  songId?: string
  title?: string
  fileSizeBytes: number
  /** Reported by the recorder, display only. */
  durationSeconds?: number
  /** Short-lived signed URL: the list is read again instead of storing it. */
  audioUrl: string
  /** Backend `DateTime`; read it with `parseUtc`. */
  createdAt: string
}

export interface RecordingValues {
  file: File
  songId?: string
  title?: string
  durationSeconds?: number
}
