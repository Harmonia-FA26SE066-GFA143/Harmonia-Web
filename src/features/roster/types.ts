/**
 * Service roster of a program (FE-35–FE-40) as Harmonia-BE models it (`ServiceRostersController`,
 * `SongListItemsController`, owner decision 2026-10-07: follow the BE). Three tiers since BE d1ca63e: choral singing
 * is not assigned (participation only); whole-service roles (organ, conductor) are set on the event and staffed once,
 * even before the song list is approved; solo and psalm roles are set per song of the approved list. This supersedes
 * roster.md (2026-10-01) on two points: lines are added, replaced and removed one at a time, and finalizing with
 * shortages needs no reason.
 */

/** `RosterStatus` of Harmonia-BE: a manual line starts a Draft, a suggestion makes it Suggested, finalizing locks it. */
export type RosterStatus = 'draft' | 'suggested' | 'finalized'

export const rosterStatusLabels: Record<RosterStatus, string> = {
  draft: 'Bản nháp',
  suggested: 'Đã gợi ý',
  finalized: 'Đã chốt',
}

/**
 * People needed for one song of the approved list (`SongPersonnelRequirementDto`, FE-35), or for the whole service
 * (`EventPersonnelRequirementDto`). A song needing no more of a skill than the whole service has is covered.
 */
export interface PersonnelRequirement {
  skillId: string
  skillName: string
  /** 1–50 (UpdateSongPersonnelRequirementsRequestValidator). */
  requiredCount: number
}

/** One row of `PUT …/personnel-requirements` (song or event); one row per skill. */
export type PersonnelRequirementValue = Pick<PersonnelRequirement, 'skillId' | 'requiredCount'>

export const maxRequiredCount = 50

/** An active line of the roster (`RosterAssignmentDto`); replaced lines are history and are not returned. */
export interface RosterAssignment {
  id: string
  memberId: string
  memberName: string
  skillId: string
  skillName: string
  /** null: a whole-service line (organ, conductor), for every song. */
  songListItemId: string | null
  /** The role, e.g. "Người dẫn truyện" in the Passion; ≤ 200 characters. */
  note?: string
  /** Suggested by the backend (FE-36) or added by the Choir Director (FE-38). */
  source: 'suggested' | 'manual'
}

/**
 * A position not fully staffed, computed by the backend (`RosterShortageDto`, FE-37). Song and title are null for a
 * whole-service position; for a song, `requiredCount` is what it needs beyond the whole-service people.
 */
export interface RosterShortage {
  songListItemId: string | null
  songTitle: string | null
  skillId: string
  skillName: string
  requiredCount: number
  assignedCount: number
}

/** `ServiceRosterDto`; an event has none until its first suggestion or manual line. */
export interface ServiceRoster {
  id: string
  status: RosterStatus
  /** When the whole-service lines were finalized early: they can still change hands, and be announced already. */
  wholeServiceFinalizedAt?: string
  assignments: RosterAssignment[]
}

/**
 * A member offered for a line: answered Confirmed or Unsure for the program, with approved skills (the backend checks
 * both again). ponytail: skills are matched by name, as `listChoirMembers` keeps names only; keep skill ids there if
 * two skills ever share a name.
 */
export interface EligibleMember {
  memberId: string
  fullName: string
  skills: string[]
}
