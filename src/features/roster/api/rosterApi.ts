import { env } from '@/config/env'
import { ApiContractMissingError } from '@/lib/api/errors'
import type { Roster, RosterSuggestion, RosterValues } from '../types'

// TBD: Backend API missing – staffing requirements and the service roster (FE-35–FE-38, FE-40). Decision 0002: no
// endpoint is guessed. Each function checks `import.meta.env.DEV` at the call site so the fixture import is dropped
// from dist/.

/** Requirements and assignments of a program; both empty when nothing was set yet. */
export async function getRoster(programId: string): Promise<Roster> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { getRosterFixture } = await import('./fixtures.dev')
    return getRosterFixture(programId)
  }
  throw new ApiContractMissingError('Xem yêu cầu nhân sự và phân công')
}

export async function saveRoster(programId: string, values: RosterValues): Promise<Roster> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { saveRosterFixture } = await import('./fixtures.dev')
    return saveRosterFixture(programId, values)
  }
  throw new ApiContractMissingError('Lưu yêu cầu nhân sự và phân công')
}

/** Suggested members for the open positions (FE-36). The matching logic is the backend's (UNRESOLVED). */
export async function getRosterSuggestions(programId: string): Promise<RosterSuggestion[]> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { getRosterSuggestionsFixture } = await import('./fixtures.dev')
    return getRosterSuggestionsFixture(programId)
  }
  throw new ApiContractMissingError('Gợi ý nhân sự')
}

/** Assignment notification to the selected members (FE-40). Channel is TBD (C5). */
export async function sendAssignmentNotifications(programId: string, memberIds: string[]): Promise<void> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { sendAssignmentNotificationsFixture } = await import('./fixtures.dev')
    return sendAssignmentNotificationsFixture(programId, memberIds)
  }
  throw new ApiContractMissingError('Gửi thông báo phân công')
}
