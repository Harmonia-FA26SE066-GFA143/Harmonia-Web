import { errorMessage } from '@/lib/api/errors'

/** Refusals of POST /api/event-participations (Harmonia-BE EventParticipationService.SendRequestsAsync). */
const messages: Record<string, string> = {
  // D8: only the director of the lead choir plans a program served by several choirs.
  CHOIR_NOT_LEAD: 'Chỉ ca trưởng của ca đoàn phụ trách chương trình mới làm được việc này.',
  EVENT_PARTICIPATION_ALREADY_REQUESTED: 'Có thành viên đã được gửi yêu cầu cho chương trình này. Danh sách đã được tải lại.',
  MEMBER_NOT_FOUND: 'Có thành viên không còn tồn tại hoặc không thuộc ca đoàn phục vụ chương trình. Vui lòng tải lại trang.',
  MEMBER_NOT_ACTIVE: 'Có thành viên không còn sinh hoạt. Vui lòng tải lại trang.',
  LITURGICAL_EVENT_NOT_FOUND: 'Chương trình không còn tồn tại.',
  LITURGICAL_EVENT_CANCELLED: 'Chương trình đã bị hủy.',
  LITURGICAL_EVENT_NOT_PUBLISHED: 'Chương trình chưa được công bố.',
  LITURGICAL_EVENT_ALREADY_PASSED: 'Chương trình đã bắt đầu, không gửi yêu cầu được nữa.',
}

export function participationErrorMessage(error: Error, fallback: string): string {
  return errorMessage(error, messages, fallback)
}
