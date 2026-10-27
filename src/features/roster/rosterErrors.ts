import { errorMessage } from '@/lib/api/errors'

/** Refusals of `/api/service-rosters` and personnel requirements the Choir Director can act on (Harmonia-BE RosterService). */
const messages: Record<string, string> = {
  // D8: only the director of the lead choir plans a program served by several choirs.
  CHOIR_NOT_LEAD: 'Chỉ ca trưởng của ca đoàn phụ trách chương trình mới làm được việc này.',
  ROSTER_ALREADY_FINALIZED: 'Phân công đã chốt, không thể thay đổi.',
  ROSTER_NOT_FINALIZED: 'Chốt phân công trước khi gửi thông báo.',
  ROSTER_NOT_FOUND: 'Chương trình chưa có phân công. Vui lòng tải lại trang.',
  ROSTER_SONG_LIST_NOT_APPROVED: 'Danh sách bài hát chưa được duyệt.',
  ROSTER_NO_PERSONNEL_REQUIREMENT: 'Thêm yêu cầu nhân sự cho ít nhất một bài trước khi gợi ý.',
  ROSTER_ASSIGNMENT_DUPLICATE: 'Ca viên này đã được phân công vào vị trí này.',
  ROSTER_ASSIGNMENT_MEMBER_NOT_CONFIRMED: 'Ca viên chưa trả lời Xác nhận hoặc Chưa chắc chắn cho chương trình.',
  ROSTER_ASSIGNMENT_MEMBER_SKILL_NOT_APPROVED: 'Ca viên chưa được duyệt kỹ năng này.',
  ROSTER_ASSIGNMENT_NOT_FOUND: 'Dòng phân công không còn tồn tại. Vui lòng tải lại trang.',
  MEMBER_NOT_ACTIVE: 'Ca viên không còn sinh hoạt.',
  MEMBER_NOT_FOUND: 'Ca viên không thuộc ca đoàn phục vụ chương trình.',
  PERSONNEL_REQUIREMENT_NOT_FOUND: 'Lưu yêu cầu nhân sự của bài trước khi phân công.',
  PERSONNEL_REQUIREMENT_DUPLICATE: 'Mỗi kỹ năng chỉ có một dòng yêu cầu trong một bài.',
  // BE d1ca63e: a skill with someone assigned cannot be taken off the song's requirements.
  PERSONNEL_REQUIREMENT_IN_USE: 'Kỹ năng này đang có người được phân công. Gỡ người khỏi dòng phân công trước khi bỏ yêu cầu.',
  SONG_LIST_NOT_LATEST_VERSION: 'Danh sách bài hát đã có phiên bản mới. Vui lòng tải lại trang.',
  SKILL_INACTIVE: 'Kỹ năng đã chọn đã ngừng dùng.',
  SKILL_NOT_FOUND: 'Kỹ năng đã chọn không còn tồn tại.',
  LITURGICAL_EVENT_CANCELLED: 'Sự kiện đã bị hủy.',
  LITURGICAL_EVENT_ALREADY_PASSED: 'Sự kiện đã diễn ra, không thể thay đổi phân công.',
}

export function rosterErrorMessage(error: Error, fallback: string): string {
  return errorMessage(error, messages, fallback)
}
