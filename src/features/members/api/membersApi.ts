import { env } from '@/config/env'
import { ApiContractMissingError } from '@/lib/api/errors'
import type { ChoirMember } from '../types'

// Backend contract exists, not wired yet: ChoirDirector-only `GET /api/member-profiles` (paged,
// keyword/status/skillId filters, rows with approvedSkills), GET and PUT {id}. Not wired: needs the shared paging
// helper and the MemberStatus mapper (audit W5).

export async function listChoirMembers(): Promise<ChoirMember[]> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { listChoirMembersFixture } = await import('./fixtures.dev')
    return listChoirMembersFixture()
  }
  throw new ApiContractMissingError('Xem danh sách thành viên ca đoàn')
}
