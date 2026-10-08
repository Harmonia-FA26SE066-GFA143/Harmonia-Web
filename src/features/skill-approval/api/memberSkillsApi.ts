import { apiRequest } from '@/lib/api/client'
import { toQuery, type PagedList } from '@/lib/api/paging'
import type { PendingSkill, SkillLevel } from '../types'

// `/api/member-skills` (Harmonia-BE MemberSkillsController): the Choir Director reads the pending declarations,
// oldest first, and approves or rejects each one. The member is notified of the decision.

export interface PendingSkillPage {
  pageNumber: number
  pageSize: number
}

type ApiSkillLevel = 'Beginner' | 'Intermediate' | 'Advanced'

const levelByApi: Record<ApiSkillLevel, SkillLevel> = {
  Beginner: 'beginner',
  Intermediate: 'intermediate',
  Advanced: 'advanced',
}

interface MemberSkillDetailDto {
  id: string
  memberFullName: string
  skillName: string
  categoryName: string
  level: ApiSkillLevel | null
  declaredAt: string
}

const toPendingSkill = ({ id, memberFullName, skillName, categoryName, level, declaredAt }: MemberSkillDetailDto): PendingSkill => ({
  id,
  memberName: memberFullName,
  skillName,
  categoryName,
  level: level ? levelByApi[level] : undefined,
  declaredAt,
})

export async function listPendingSkills(page: PendingSkillPage): Promise<PagedList<PendingSkill>> {
  const result = await apiRequest<PagedList<MemberSkillDetailDto>>(`/api/member-skills/pending${toQuery({ ...page })}`)
  return { ...result, items: result.items.map(toPendingSkill) }
}

export async function approveSkill(id: string): Promise<void> {
  await apiRequest<unknown>(`/api/member-skills/${id}/approve`, { method: 'PATCH' })
}

/** The reason is required and shown to the member (RejectMemberSkillRequestValidator: ≤ 500). */
export async function rejectSkill(id: string, reason: string): Promise<void> {
  await apiRequest<unknown>(`/api/member-skills/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ reason }) })
}
