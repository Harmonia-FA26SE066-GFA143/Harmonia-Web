import { env } from '@/config/env'
import { apiRequest } from '@/lib/api/client'
import type { AttendanceRecord, AttendanceValue } from '../types'

// `/api/rehearsals/{id}/attendances` (Harmonia-BE RehearsalsController), Choir Director only. The rehearsal list the
// page picks from has no endpoint for the Choir Director yet (tbd-backlog B20), so in development with fixtures on
// the attendance fixture answers too, keyed by the rehearsal fixture's ids.

type ApiAttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused'

const valueByApi: Record<ApiAttendanceStatus, AttendanceValue> = {
  Present: 'present',
  Absent: 'absent',
  Late: 'late',
  Excused: 'excused',
}

const apiStatus = Object.fromEntries(Object.entries(valueByApi).map(([api, value]) => [value, api])) as Record<
  AttendanceValue,
  ApiAttendanceStatus
>

interface RehearsalAttendanceDto {
  memberId: string
  fullName: string
  status: ApiAttendanceStatus | null
}

/** The sheet of one session, every member listed; `value` is absent until recorded. */
export async function getAttendance(rehearsalId: string): Promise<AttendanceRecord[]> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { getAttendanceFixture } = await import('./fixtures.dev')
    return getAttendanceFixture(rehearsalId)
  }
  const rows = await apiRequest<RehearsalAttendanceDto[]>(`/api/rehearsals/${rehearsalId}/attendances`)
  return rows.map(({ memberId, fullName, status }) => ({
    memberId,
    fullName,
    value: status ? valueByApi[status] : undefined,
  }))
}

/** Records or corrects the given members, keyed by member id; members left out keep what they had. */
export async function saveAttendance(rehearsalId: string, values: Record<string, AttendanceValue>): Promise<void> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { saveAttendanceFixture } = await import('./fixtures.dev')
    return saveAttendanceFixture(rehearsalId, values)
  }
  await apiRequest<unknown>(`/api/rehearsals/${rehearsalId}/attendances`, {
    method: 'PUT',
    body: JSON.stringify({
      items: Object.entries(values).map(([memberId, value]) => ({ memberId, status: apiStatus[value] })),
    }),
  })
}
