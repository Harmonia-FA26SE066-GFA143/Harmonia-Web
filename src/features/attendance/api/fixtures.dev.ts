/**
 * DEV FIXTURE – không phải API contract.
 * Decision 0002 option B (approved by Daniel 2026-09-27): UI review without a backend. Loaded only through the
 * dynamic import in `attendanceApi.ts` when `import.meta.env.DEV && VITE_USE_DEV_FIXTURES=true`.
 * Fixture assumption: every choir member is on every session's list (who is listed is UNRESOLVED). Rehearsal ids
 * match the rehearsals fixture: the past sessions have values, the latest one is partly marked.
 */
import { choirMembers } from '@/features/members/api/fixtures.dev'
import { readFixture, writeFixture } from '@/lib/api/fixtureRuntime.dev'
import type { AttendanceRecord, AttendanceValue } from '../types'

const marked = new Map<string, Record<string, AttendanceValue>>([
  [
    'dev-rehearsal-1',
    Object.fromEntries(choirMembers.map((member, index) => [member.id, index === 4 || index === 7 ? 'absent' : 'present'])),
  ],
  [
    'dev-rehearsal-2',
    {
      'dev-member-3': 'present',
      'dev-member-4': 'present',
      'dev-member-5': 'absent',
      'dev-member-6': 'present',
      'dev-member-10': 'present',
    },
  ],
])

const records = (rehearsalId: string): AttendanceRecord[] => {
  const values = marked.get(rehearsalId) ?? {}
  return choirMembers.map(({ id, fullName, skills }) => ({ memberId: id, fullName, skills, value: values[id] }))
}

export const getAttendanceFixture = (rehearsalId: string) => readFixture(records(rehearsalId))

export const saveAttendanceFixture = (rehearsalId: string, values: Record<string, AttendanceValue>) =>
  writeFixture(() => {
    marked.set(rehearsalId, { ...marked.get(rehearsalId), ...values })
    return { records: records(rehearsalId) }
  }).then((result) => result.records)
