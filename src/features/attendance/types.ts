/**
 * Actual attendance at a rehearsal session (FE-45): `AttendanceStatus` of Harmonia-BE (Present, Absent, Late,
 * Excused), which settles the late / excused question left open on 2026-09-29 (rehearsal-attendance.md).
 * TBD: Backend API missing – the entity has no controller yet.
 */
export type AttendanceValue = 'present' | 'absent' | 'late' | 'excused'

export const attendanceValues: AttendanceValue[] = ['present', 'late', 'excused', 'absent']

export const attendanceLabels: Record<AttendanceValue, string> = {
  present: 'Có mặt',
  late: 'Đi muộn',
  excused: 'Vắng có phép',
  absent: 'Vắng không phép',
}

/** Button labels of the attendance sheet, short enough to keep the four choices on one line. */
export const attendanceShortLabels: Record<AttendanceValue, string> = {
  present: 'Có mặt',
  late: 'Muộn',
  excused: 'Có phép',
  absent: 'Vắng',
}

/**
 * One member on a session's attendance list (`RehearsalAttendanceDto`); `value` is absent until marked. The backend
 * lists the choir members (decision 2026-09-30, 6a.8) by name only, without their skills.
 */
export interface AttendanceRecord {
  memberId: string
  fullName: string
  value?: AttendanceValue
}
