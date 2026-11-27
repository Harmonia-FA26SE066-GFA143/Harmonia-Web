/**
 * Actual attendance at a rehearsal session (FE-45): `AttendanceStatus` of Harmonia-BE (Present, Absent, Late,
 * Excused), which settles the late / excused question left open on 2026-09-29 (rehearsal-attendance.md).
 */
import { ATTENDANCE_LATE_LABEL } from '@/shared/ui/glossary'

export type AttendanceValue = 'present' | 'absent' | 'late' | 'excused'

export const attendanceValues: AttendanceValue[] = ['present', 'late', 'excused', 'absent']

export const attendanceLabels: Record<AttendanceValue, string> = {
  present: 'Có mặt',
  late: ATTENDANCE_LATE_LABEL,
  excused: 'Vắng có phép',
  absent: 'Vắng không phép',
}

/** Button labels of the attendance sheet, short enough to keep the four choices on one line. */
export const attendanceShortLabels: Record<AttendanceValue, string> = {
  present: 'Có mặt',
  late: ATTENDANCE_LATE_LABEL,
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
  /**
   * False for a member who left or went inactive after being recorded: the line is read-only, and saving it refuses
   * the whole sheet (MEMBER_NOT_ACTIVE, BE 463279d).
   */
  isActive: boolean
}
