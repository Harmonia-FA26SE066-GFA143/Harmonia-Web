import { env } from '@/config/env'
import { ApiContractMissingError } from '@/lib/api/errors'
import type { ChoirMember } from '../types'

// TBD: Backend API missing – the Choir Director's member list (FE-24). Decision 0002: no endpoint is guessed.

export async function listChoirMembers(): Promise<ChoirMember[]> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { listChoirMembersFixture } = await import('./fixtures.dev')
    return listChoirMembersFixture()
  }
  throw new ApiContractMissingError('Xem danh sách thành viên ca đoàn')
}
