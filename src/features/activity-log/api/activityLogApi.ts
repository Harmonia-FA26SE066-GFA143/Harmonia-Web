import { env } from '@/config/env'
import { ApiContractMissingError } from '@/lib/api/errors'
import type { ActivityRecord } from '../types'

// TBD: Backend API missing – activity history (FE-54). Decision 0002: no endpoint is guessed.
// Paging and server-side filters are TBD; records are filtered client-side for now.
// The call site checks `import.meta.env.DEV` so the fixture import is dropped from dist/.

/** Records newest first. */
export async function listActivityLog(): Promise<ActivityRecord[]> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { listActivityLogFixture } = await import('./fixtures.dev')
    return listActivityLogFixture()
  }
  throw new ApiContractMissingError('Xem lịch sử hoạt động')
}
