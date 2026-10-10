import { ApiError } from '@/lib/api/errors'

/** Refusals of the practice endpoints the Choir Director can act on (Harmonia-BE PracticeAssignmentService, PracticeSubmissionService). */
const messages: Record<string, string> = {
  PRACTICE_SUBMISSION_NOT_FOUND: 'Bản thu không còn tồn tại. Vui lòng tải lại trang.',
  PRACTICE_SUBMISSION_SUPERSEDED: 'Ca viên đã nộp bản thu mới hơn; hãy chấm bản mới nhất.',
  PRACTICE_SUBMISSION_ALREADY_REVIEWED: 'Bản thu vừa được chấm. Thông tin đã được tải lại.',
  PRACTICE_SUBMISSION_ALREADY_PASSED: 'Bài đã đạt, không chấm lại được.',
  PRACTICE_SUBMISSION_NOT_REVIEWED: 'Bản thu chưa được chấm; hãy chấm trước khi nhận xét thêm.',
  PRACTICE_SUBMISSION_CONFLICT: 'Bản thu vừa thay đổi. Thông tin đã được tải lại.',
  PRACTICE_DUE_DATE_IN_PAST: 'Hạn nộp phải sau thời điểm hiện tại.',
  PRACTICE_TARGET_REQUIRED: 'Chọn ít nhất một kỹ năng hoặc một ca viên.',
  EVENT_NOT_FOUND: 'Sự kiện đã chọn không còn tồn tại.',
  EVENT_CANCELLED: 'Sự kiện đã chọn đã bị hủy.',
  SONG_NOT_FOUND: 'Bài hát đã chọn không còn tồn tại.',
  SONG_INACTIVE: 'Bài hát đã chọn đã bị xoá khỏi kho.',
  MATERIAL_NOT_FOUND: 'Tài liệu đã chọn không còn tồn tại hoặc không thuộc bài hát.',
  SKILL_NOT_FOUND: 'Có kỹ năng đã chọn không còn tồn tại.',
  SKILL_INACTIVE: 'Có kỹ năng đã chọn đã ngừng dùng.',
  MEMBER_NOT_FOUND: 'Có ca viên đã chọn không còn tồn tại.',
  MEMBER_NOT_ACTIVE: 'Có ca viên đã chọn không còn sinh hoạt.',
}

export function practiceErrorMessage(error: Error, fallback: string): string {
  return (error instanceof ApiError && error.code !== undefined && messages[error.code]) || fallback
}
