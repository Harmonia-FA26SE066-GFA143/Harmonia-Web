import { apiRequest } from '@/lib/api/client'
import { toQuery, type PagedList } from '@/lib/api/paging'
import type { ChoirMember } from '../types'

// `GET /api/member-profiles` (Harmonia-BE MemberProfilesController), Choir Director only, sorted by name.

interface MemberProfileSummaryDto {
  id: string
  fullName: string
  approvedSkills: { skillId: string; skillName: string }[]
}

/** Active members only (owner decision 2026-10-06): the lists that use them invite members to serve. */
export async function listChoirMembers(): Promise<ChoirMember[]> {
  // ponytail: one page of 100, the backend maximum; a larger choir would need paging or a search here.
  const page = await apiRequest<PagedList<MemberProfileSummaryDto>>(
    `/api/member-profiles${toQuery({ status: 'Active', pageNumber: 1, pageSize: 100 })}`,
  )
  return page.items.map(({ id, fullName, approvedSkills }) => ({
    id,
    fullName,
    skills: approvedSkills.map((skill) => skill.skillName),
  }))
}
