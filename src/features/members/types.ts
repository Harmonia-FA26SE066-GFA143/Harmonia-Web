/**
 * A choir member as the Choir Director sees them when sending confirmation requests (FE-33) and taking
 * attendance (FE-45). `skills` are the member's approved skills (FE-02, FE-25) as display names, mapped from
 * `MemberProfileSummaryDto.approvedSkills`. Whether instrumentalists are listed here or separately is UNRESOLVED
 * (roles-permissions).
 */
export interface ChoirMember {
  id: string
  fullName: string
  skills: string[]
}
