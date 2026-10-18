/** A choir of the parish (`ChoirDto`, D7); the Choir Director manages every choir. */
export interface Choir {
  id: string
  name: string
  description?: string
  /** A switched-off choir keeps its members and events but takes no new ones. */
  isActive: boolean
}

/** Body of POST and PUT /api/choirs: name required and unique (≤ 100), description ≤ 500. */
export interface ChoirValues {
  name: string
  description?: string
  isActive: boolean
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
