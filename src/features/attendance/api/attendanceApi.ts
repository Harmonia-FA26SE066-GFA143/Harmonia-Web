import { env } from '@/config/env'
import { ApiContractMissingError } from '@/lib/api/errors'
import type { AttendanceRecord, AttendanceValue } from '../types'

// TBD: Backend API missing – attendance of rehearsal sessions (FE-45–FE-46). Decision 0002: no endpoint is
// guessed. Each function checks `import.meta.env.DEV` at the call site so the fixture import is dropped from dist/.

export async function getAttendance(rehearsalId: string): Promise<AttendanceRecord[]> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { getAttendanceFixture } = await import('./fixtures.dev')
    return getAttendanceFixture(rehearsalId)
  }
  throw new ApiContractMissingError('Xem điểm danh buổi tập')
}

/** Saves the marked values of the session, keyed by member id. */
export async function saveAttendance(rehearsalId: string, values: Record<string, AttendanceValue>): Promise<AttendanceRecord[]> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { saveAttendanceFixture } = await import('./fixtures.dev')
    return saveAttendanceFixture(rehearsalId, values)
  }
  throw new ApiContractMissingError('Lưu điểm danh buổi tập')
}
