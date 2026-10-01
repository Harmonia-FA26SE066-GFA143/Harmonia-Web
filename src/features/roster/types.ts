/** A skill from the skill catalog (FE-49) as used by a requirement. */
export interface RosterSkill {
  id: string
  name: string
}

/**
 * A staffing requirement (FE-35): a skill and a number of people, for one song of the approved list or, when
 * `songId` is absent, for the whole program (decision 2026-10-01, roster.md).
 * TBD: Backend API missing – identifiers and field names come with the contract.
 */
export interface RosterRequirement {
  id: string
  songId?: string
  skill: RosterSkill
  count: number
}

export interface RosterAssignment {
  requirementId: string
  memberId: string
  fullName: string
}

export interface Roster {
  programId: string
  requirements: RosterRequirement[]
  assignments: RosterAssignment[]
}

export type RosterValues = Omit<Roster, 'programId'>

/** A suggested member for a requirement; the suggestion logic belongs to the backend (FE-36, UNRESOLVED). */
export type RosterSuggestion = RosterAssignment

/**
 * A member who can be assigned: confirmed for the program (decision 2026-10-01) with their skills.
 * TBD: the API must return approved skills only (FE-02/FE-25 distinguish declared and approved skills); skills are
 * matched by name until members carry skill ids.
 */
export interface EligibleMember {
  memberId: string
  fullName: string
  skills: string[]
}

/** An assignment still meets the rule: the member is confirmed and holds the required skill. */
export const isEligible = (eligible: EligibleMember[], memberId: string, requirement: RosterRequirement) =>
  eligible.some((member) => member.memberId === memberId && member.skills.includes(requirement.skill.name))

/**
 * Missing people per requirement (FE-37): the count minus the assignments that are still eligible. An assignment
 * whose member declined or lost the skill is kept (what should happen to it is TBD) but does not fill the position.
 */
export function shortages(values: RosterValues, eligible: EligibleMember[]): { requirement: RosterRequirement; missing: number }[] {
  return values.requirements
    .map((requirement) => ({
      requirement,
      missing:
        requirement.count -
        values.assignments.filter((item) => item.requirementId === requirement.id && isEligible(eligible, item.memberId, requirement))
          .length,
    }))
    .filter((entry) => entry.missing > 0)
}
