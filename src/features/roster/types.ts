/**
 * Service roster of a program (FE-35–FE-40) as Harmonia-BE models it (`ServiceRostersController`,
 * `SongListItemsController`, owner decision 2026-10-07: follow the BE). This supersedes roster.md (2026-10-01) on
 * three points: requirements exist per song of the approved list only (no whole-program positions), lines are
 * added, replaced and removed one at a time, and finalizing with shortages needs no reason.
 */

/** `RosterStatus` of Harmonia-BE: a manual line starts a Draft, a suggestion makes it Suggested, finalizing locks it. */
export type RosterStatus = 'draft' | 'suggested' | 'finalized'

export const rosterStatusLabels: Record<RosterStatus, string> = {
  draft: 'Bản nháp',
  suggested: 'Đã gợi ý',
  finalized: 'Đã chốt',
}

/** People needed for one song of the approved list (`SongPersonnelRequirementDto`, FE-35). */
export interface PersonnelRequirement {
  skillId: string
  skillName: string
  /** 1–50 (UpdateSongPersonnelRequirementsRequestValidator). */
  requiredCount: number
}

/** One row of `PUT /api/song-list-items/{id}/personnel-requirements`; one row per skill. */
export type PersonnelRequirementValue = Pick<PersonnelRequirement, 'skillId' | 'requiredCount'>

export const maxRequiredCount = 50

/** An active line of the roster (`RosterAssignmentDto`); replaced lines are history and are not returned. */
export interface RosterAssignment {
  id: string
  memberId: string
  memberName: string
  skillId: string
  skillName: string
  songListItemId: string | null
  /** Suggested by the backend (FE-36) or added by the Choir Director (FE-38). */
  source: 'suggested' | 'manual'
}

/** A song / skill pair not fully staffed, computed by the backend (`RosterShortageDto`, FE-37). */
export interface RosterShortage {
  songListItemId: string
  songTitle: string
  skillId: string
  skillName: string
  requiredCount: number
  assignedCount: number
}

/** `ServiceRosterDto`; an event has none until its first suggestion or manual line. */
export interface ServiceRoster {
  id: string
  status: RosterStatus
  assignments: RosterAssignment[]
}

/**
 * A member offered for a line: confirmed for the program, with approved skills (the backend checks both again).
 * ponytail: skills are matched by name while participation is a dev fixture; use skill ids when it has an API (B15).
 */
export interface EligibleMember {
  memberId: string
  fullName: string
  skills: string[]
}
