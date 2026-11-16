import { errorMessage } from '@/lib/api/errors'

/** PUT /api/rehearsals/{id}/attendances refusals (Harmonia-BE RehearsalAttendanceService). */
const messages: Record<string, string> = {
  // A joint rehearsal: only the lead choir's director reads and records it (BE 69c9d47).
  CHOIR_NOT_LEAD: 'Buổi tập chung do ca trưởng của ca đoàn phụ trách chương trình điểm danh.',
  REHEARSAL_NOT_FOUND: 'Buổi tập không còn tồn tại. Vui lòng tải lại trang.',
  REHEARSAL_NOT_STARTED: 'Chưa tới giờ mở điểm danh của buổi tập này. Các đánh dấu vẫn giữ trên trang, vui lòng lưu lại khi tới giờ.',
  MEMBER_NOT_FOUND: 'Có ca viên không còn tồn tại. Vui lòng tải lại trang.',
  MEMBER_NOT_ACTIVE: 'Có ca viên không còn sinh hoạt. Vui lòng tải lại trang.',
  REHEARSAL_ATTENDANCE_ALREADY_RECORDED: 'Điểm danh vừa được người khác lưu. Danh sách đã được tải lại, vui lòng kiểm tra rồi lưu lại.',
}

export function attendanceErrorMessage(error: Error): string {
  return errorMessage(error, messages, 'Không thể lưu điểm danh. Vui lòng thử lại.')
}
