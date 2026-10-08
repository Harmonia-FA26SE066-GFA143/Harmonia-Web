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

/** `MemberStatus` of Harmonia-BE. */
export type MemberStatus = 'active' | 'inactive' | 'left'

export const memberStatuses: MemberStatus[] = ['active', 'inactive', 'left']

export const memberStatusLabels: Record<MemberStatus, string> = {
  active: 'Đang sinh hoạt',
  inactive: 'Tạm nghỉ',
  left: 'Đã rời ca đoàn',
}

/**
 * A choir member record as the Choir Director manages it (FE-24): `MemberProfileSummaryDto` of
 * `GET /api/member-profiles`. Name and email belong to the account; the member or the Admin edits them.
 */
export interface MemberProfile {
  id: string
  fullName: string
  email: string
  phone: string | null
  /** `DateOnly`, YYYY-MM-DD. */
  dateOfBirth: string | null
  /** `DateOnly`, YYYY-MM-DD. */
  joinedDate: string
  status: MemberStatus
  /** Names of the approved skills. */
  skills: string[]
}

/**
 * Body of PUT /api/member-profiles/{id} (UpdateMemberProfileRequestValidator): phone ≤ 20, dates not after today,
 * joined date required. Every field is replaced, so an empty phone or birth date clears it.
 */
export interface MemberProfileValues {
  phone?: string
  dateOfBirth?: string
  joinedDate: string
  status: MemberStatus
}

/** Query filters of GET /api/member-profiles; they combine with AND on the server. */
export interface MemberFilters {
  /** Matches the full name or the email. */
  search: string
  status?: MemberStatus
  /** Members with this skill approved. */
  skillId?: string
}
