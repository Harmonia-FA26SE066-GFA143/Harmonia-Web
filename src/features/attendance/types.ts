/**
 * Actual attendance at a rehearsal session (FE-45). Values decided by the owner on 2026-09-29
 * (rehearsal-attendance.md, DECIDED): Present / Absent. Late or excused absence is UNRESOLVED.
 * TBD: Backend API missing – persisted values come with the contract.
 */
export type AttendanceValue = 'present' | 'absent'

export const attendanceLabels: Record<AttendanceValue, string> = {
  present: 'Có mặt',
  absent: 'Vắng',
}

/**
 * One member on a session's attendance list; `value` is absent until marked. The list holds the choir members
 * (decision 2026-09-30, 6a.8); the backend returns it.
 */
export interface AttendanceRecord {
  memberId: string
  fullName: string
  skills: string[]
  value?: AttendanceValue
}
