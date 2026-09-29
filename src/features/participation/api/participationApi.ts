import { env } from '@/config/env'
import { ApiContractMissingError } from '@/lib/api/errors'
import type { ParticipationRequest } from '../types'

// TBD: Backend API missing – participation confirmation requests and responses (FE-06, FE-33–FE-34).
// Decision 0002: no endpoint is guessed. Each function checks `import.meta.env.DEV` at the call site so the
// fixture import is dropped from dist/.

/** Members sent the program's confirmation request, with their responses; empty when none was sent. */
export async function getParticipation(programId: string): Promise<ParticipationRequest[]> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { getParticipationFixture } = await import('./fixtures.dev')
    return getParticipationFixture(programId)
  }
  throw new ApiContractMissingError('Xem phản hồi xác nhận tham gia')
}

/** Sends the request to the given members; members already sent it get it again (resend). */
export async function sendParticipationRequests(programId: string, memberIds: string[]): Promise<ParticipationRequest[]> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { sendParticipationRequestsFixture } = await import('./fixtures.dev')
    return sendParticipationRequestsFixture(programId, memberIds)
  }
  throw new ApiContractMissingError('Gửi yêu cầu xác nhận tham gia')
}
