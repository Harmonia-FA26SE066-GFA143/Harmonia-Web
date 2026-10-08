import { apiRequest } from '@/lib/api/client'
import { toQuery, type PagedList } from '@/lib/api/paging'
import type { ChoirMember, MemberFilters, MemberProfile, MemberProfileValues, MemberStatus } from '../types'

// `/api/member-profiles` (Harmonia-BE MemberProfilesController), Choir Director only, sorted by name.

type ApiMemberStatus = 'Active' | 'Inactive' | 'Left'

const statusByApi: Record<ApiMemberStatus, MemberStatus> = { Active: 'active', Inactive: 'inactive', Left: 'left' }

const apiStatus = Object.fromEntries(Object.entries(statusByApi).map(([api, status]) => [status, api])) as Record<
  MemberStatus,
  ApiMemberStatus
>

interface MemberProfileSummaryDto {
  id: string
  fullName: string
  email: string
  phone: string | null
  dateOfBirth: string | null
  joinedDate: string
  status: ApiMemberStatus
  approvedSkills: { skillId: string; skillName: string }[]
}

const skillNames = (dto: MemberProfileSummaryDto) => dto.approvedSkills.map((skill) => skill.skillName)

/** Active members only (owner decision 2026-10-06): the lists that use them invite members to serve. */
export async function listChoirMembers(): Promise<ChoirMember[]> {
  // ponytail: one page of 100, the backend maximum; a larger choir would need paging or a search here.
  const page = await apiRequest<PagedList<MemberProfileSummaryDto>>(
    `/api/member-profiles${toQuery({ status: 'Active', pageNumber: 1, pageSize: 100 })}`,
  )
  return page.items.map((dto) => ({ id: dto.id, fullName: dto.fullName, skills: skillNames(dto) }))
}

export interface MemberPage {
  pageNumber: number
  pageSize: number
}

export async function searchMembers(filters: MemberFilters, page: MemberPage): Promise<PagedList<MemberProfile>> {
  const result = await apiRequest<PagedList<MemberProfileSummaryDto>>(
    `/api/member-profiles${toQuery({
      keyword: filters.search.trim(),
      status: filters.status && apiStatus[filters.status],
      skillId: filters.skillId,
      ...page,
    })}`,
  )
  return { ...result, items: result.items.map(toMemberProfile) }
}

const toMemberProfile = (dto: MemberProfileSummaryDto): MemberProfile => ({
  id: dto.id,
  fullName: dto.fullName,
  email: dto.email,
  phone: dto.phone,
  dateOfBirth: dto.dateOfBirth,
  joinedDate: dto.joinedDate,
  status: statusByApi[dto.status],
  skills: skillNames(dto),
})

export async function updateMember(id: string, values: MemberProfileValues): Promise<void> {
  await apiRequest<unknown>(`/api/member-profiles/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...values, status: apiStatus[values.status] }),
  })
}
