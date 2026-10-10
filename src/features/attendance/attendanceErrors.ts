import { ApiError } from '@/lib/api/errors'

/** PUT /api/rehearsals/{id}/attendances refusals (Harmonia-BE RehearsalAttendanceService). */
const messages: Record<string, string> = {
  REHEARSAL_NOT_FOUND: 'Buổi tập không còn tồn tại. Vui lòng tải lại trang.',
  REHEARSAL_NOT_STARTED: 'Buổi tập chưa bắt đầu, chưa điểm danh được.',
  MEMBER_NOT_FOUND: 'Có ca viên không còn tồn tại. Vui lòng tải lại trang.',
  MEMBER_NOT_ACTIVE: 'Có ca viên không còn sinh hoạt. Vui lòng tải lại trang.',
  ATTENDANCE_ALREADY_RECORDED: 'Điểm danh vừa được người khác lưu. Danh sách đã được tải lại, vui lòng kiểm tra rồi lưu lại.',
}

export function attendanceErrorMessage(error: Error): string {
  return (
    (error instanceof ApiError && error.code !== undefined && messages[error.code]) ||
    'Không thể lưu điểm danh. Vui lòng thử lại.'
  )
}
