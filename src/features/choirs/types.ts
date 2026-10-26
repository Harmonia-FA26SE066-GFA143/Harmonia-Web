/**
 * A choir of the parish (`ChoirDto`, D7, D8). The Admin creates choirs and gives each one director; a Choir Director
 * sees and manages the members of their own choirs only.
 */
export interface Choir {
  id: string
  name: string
  description?: string
  /** A switched-off choir keeps its members and events but takes no new ones. */
  isActive: boolean
  /** `User` id of the Choir Director in charge; absent while the Admin has not chosen one. */
  directorId?: string
  directorName?: string
}

/** Body of POST and PUT /api/choirs (Admin): name required and unique (≤ 100), description ≤ 500. */
export interface ChoirValues {
  name: string
  description?: string
  isActive: boolean
  directorId?: string
}

/** A choir serving an event (`LiturgicalEventChoirDto`); the lead choir plans the event (D8). */
export interface EventChoir {
  choirId: string
  name: string
  isActive: boolean
  isLead: boolean
  directorId?: string
  directorName?: string
}

/** An active member of a choir (`ChoirMemberDto`). */
export interface ChoirMembership {
  /** Member profile id. */
  memberId: string
  fullName: string
  email: string
  /** Calendar date in Vietnam, YYYY-MM-DD. */
  joinedDate: string
}
