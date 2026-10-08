import { ApiError } from '@/lib/api/errors'

/** Refusals of `/api/service-rosters` and personnel requirements the Choir Director can act on (Harmonia-BE RosterService). */
const messages: Record<string, string> = {
  ROSTER_ALREADY_FINALIZED: 'Phân công đã chốt, không thể thay đổi.',
  ROSTER_NOT_FINALIZED: 'Chốt phân công trước khi gửi thông báo.',
  ROSTER_NOT_FOUND: 'Chương trình chưa có phân công. Vui lòng tải lại trang.',
  ROSTER_SONG_LIST_NOT_APPROVED: 'Danh sách bài hát chưa được duyệt.',
  ROSTER_NO_PERSONNEL_REQUIREMENT: 'Thêm yêu cầu nhân sự cho ít nhất một bài trước khi gợi ý.',
  ASSIGNMENT_DUPLICATE: 'Ca viên này đã được phân công vào vị trí này.',
  ASSIGNMENT_MEMBER_NOT_CONFIRMED: 'Ca viên chưa xác nhận tham gia chương trình.',
  ASSIGNMENT_MEMBER_SKILL_NOT_APPROVED: 'Ca viên chưa được duyệt kỹ năng này.',
  ASSIGNMENT_NOT_FOUND: 'Dòng phân công không còn tồn tại. Vui lòng tải lại trang.',
  MEMBER_NOT_ACTIVE: 'Ca viên không còn sinh hoạt.',
  PERSONNEL_REQUIREMENT_NOT_FOUND: 'Lưu yêu cầu nhân sự của bài trước khi phân công.',
  PERSONNEL_REQUIREMENT_DUPLICATE: 'Mỗi kỹ năng chỉ có một dòng yêu cầu trong một bài.',
  SONG_LIST_NOT_LATEST_VERSION: 'Danh sách bài hát đã có phiên bản mới. Vui lòng tải lại trang.',
  SKILL_INACTIVE: 'Kỹ năng đã chọn đã ngừng dùng.',
  SKILL_NOT_FOUND: 'Kỹ năng đã chọn không còn tồn tại.',
  EVENT_CANCELLED: 'Sự kiện đã bị hủy.',
  EVENT_ALREADY_PASSED: 'Sự kiện đã diễn ra, không thể thay đổi phân công.',
}

export function rosterErrorMessage(error: Error, fallback: string): string {
  return (error instanceof ApiError && error.code !== undefined && messages[error.code]) || fallback
}
