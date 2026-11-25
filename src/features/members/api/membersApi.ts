import type { ApiRoleName } from '@/lib/auth/session'
import { roleByApiName } from '@/shared/types/account'
import type { Gender } from '@/shared/utils/personName'
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
  choirs?: { id: string; name: string }[]
  id: string
  fullName: string
  email: string
  phone: string | null
  saintName: string | null
  gender: Gender | null
  dateOfBirth: string | null
  joinedDate: string
  status: ApiMemberStatus
  /** `id` is the MemberSkill id, used to revoke (MemberSkillSummaryDto.cs, B63). */
  approvedSkills: { id: string; skillId: string; skillName: string }[]
  avatarUrl: string | null
  roleName: ApiRoleName
}

const skillNames = (dto: MemberProfileSummaryDto) => dto.approvedSkills.map((skill) => skill.skillName)

const toChoirMember = (dto: MemberProfileSummaryDto): ChoirMember => ({
  id: dto.id,
  choirs: dto.choirs ?? [],
  fullName: dto.fullName,
  skills: skillNames(dto),
  roleName: dto.roleName,
})

// 100 is the backend maximum page size (MemberProfilesController).
const activePage = (pageNumber: number) =>
  apiRequest<PagedList<MemberProfileSummaryDto>>(`/api/member-profiles${toQuery({ status: 'Active', pageNumber, pageSize: 100 })}`)

/** Active members only (owner decision 2026-10-06): the lists that use them invite members to serve. */
export async function listChoirMembers(): Promise<ChoirMember[]> {
  // ponytail: one page of 100, the backend maximum; a larger choir would need paging or a search here.
  return (await activePage(1)).items.map(toChoirMember)
}

/** Every active member across all pages, for counts that must not stop at 100 (G2-03, B54). */
export async function listAllChoirMembers(): Promise<ChoirMember[]> {
  const first = await activePage(1)
  // ponytail: 50 pages (5,000 members) bound against a runaway loop; far beyond a parish.
  const rest = await Promise.all(
    Array.from({ length: Math.min(first.totalPages, 50) - 1 }, (_, index) => activePage(index + 2)),
  )
  return [first, ...rest].flatMap((page) => page.items.map(toChoirMember))
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
  choirs: dto.choirs ?? [],
  approvedSkills: dto.approvedSkills.map(({ id, skillName }) => ({ id, name: skillName })),
  fullName: dto.fullName,
  email: dto.email,
  phone: dto.phone,
  saintName: dto.saintName,
  gender: dto.gender,
  dateOfBirth: dto.dateOfBirth,
  joinedDate: dto.joinedDate,
  status: statusByApi[dto.status],
  skills: skillNames(dto),
  avatarUrl: dto.avatarUrl ?? undefined,
  role: roleByApiName[dto.roleName],
})

export async function updateMember(id: string, values: MemberProfileValues): Promise<void> {
  await apiRequest<unknown>(`/api/member-profiles/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...values, status: apiStatus[values.status] }),
  })
}
