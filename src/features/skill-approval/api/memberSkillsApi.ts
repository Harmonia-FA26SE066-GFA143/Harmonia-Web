import { apiRequest } from '@/lib/api/client'
import { toQuery, type PagedList } from '@/lib/api/paging'
import type { PendingSkill } from '../types'

// `/api/member-skills` (Harmonia-BE MemberSkillsController): the Choir Director reads the pending declarations,
// oldest first, with the evidence the member attached (BE 9b1f587), and approves or rejects each one. The member is
// notified of the decision.

export interface PendingSkillPage {
  pageNumber: number
  pageSize: number
}

interface MemberSkillDetailDto {
  id: string
  memberFullName: string
  skillName: string
  categoryName: string
  declaredAt: string
  evidence: { type: 'Voice' | 'Clip'; fileName: string; url: string } | null
}

const toPendingSkill = ({ id, memberFullName, skillName, categoryName, declaredAt, evidence }: MemberSkillDetailDto): PendingSkill => ({
  id,
  memberName: memberFullName,
  skillName,
  categoryName,
  declaredAt,
  evidence: evidence ? { kind: evidence.type === 'Voice' ? 'voice' : 'clip', fileName: evidence.fileName, url: evidence.url } : undefined,
})

export async function listPendingSkills(page: PendingSkillPage): Promise<PagedList<PendingSkill>> {
  const result = await apiRequest<PagedList<MemberSkillDetailDto>>(`/api/member-skills/pending${toQuery({ ...page })}`)
  return { ...result, items: result.items.map(toPendingSkill) }
}

export async function approveSkill(id: string): Promise<void> {
  await apiRequest<unknown>(`/api/member-skills/${id}/approve`, { method: 'PATCH' })
}

/**
 * Takes back an approved skill (PATCH api/member-skills/{id}/revoke, MemberSkillsController.cs:93-98): the reason is
 * required (≤ 500), the member and the lead directors of affected events are notified (MemberSkillService.cs:182-207).
 */
export async function revokeSkill(id: string, reason: string): Promise<void> {
  await apiRequest<unknown>(`/api/member-skills/${id}/revoke`, { method: 'PATCH', body: JSON.stringify({ reason }) })
}

/** The reason is required and shown to the member (RejectMemberSkillRequestValidator: ≤ 500). */
export async function rejectSkill(id: string, reason: string): Promise<void> {
  await apiRequest<unknown>(`/api/member-skills/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ reason }) })
}
