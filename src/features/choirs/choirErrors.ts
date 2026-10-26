import { ApiError, requestFailureMessage } from '@/lib/api/errors'

/** Refusals of `/api/choirs` and `/api/liturgical-events/{id}/choirs` (Harmonia-BE ChoirService). */
const messages: Record<string, string> = {
  CHOIR_NOT_FOUND: 'Ca đoàn không còn tồn tại. Danh sách đã được tải lại.',
  CHOIR_DIRECTOR_INVALID: 'Người được chọn không còn là ca trưởng đang hoạt động. Vui lòng chọn lại.',
  CHOIR_LEAD_INVALID: 'Chọn ca đoàn phụ trách trong số các ca đoàn phục vụ.',
  CHOIR_NAME_ALREADY_EXISTS: 'Đã có ca đoàn trùng tên.',
  CHOIR_MEMBER_INVALID: 'Có ca viên không còn sinh hoạt. Danh sách đã được tải lại.',
  CHOIR_INACTIVE: 'Ca đoàn đã ngừng hoạt động nên không nhận thêm ca viên hay sự kiện.',
  CHOIR_MEMBERSHIP_NOT_FOUND: 'Ca viên đã không còn trong ca đoàn. Danh sách đã được tải lại.',
  LITURGICAL_EVENT_NOT_FOUND: 'Chương trình không còn tồn tại.',
  LITURGICAL_EVENT_CANCELLED: 'Chương trình đã bị hủy.',
  LITURGICAL_EVENT_ALREADY_PASSED: 'Chương trình đã qua, không đổi ca đoàn phục vụ được.',
}

/** The message of the error code, or of the first field error code (400 VALIDATION_FAILED), else `fallback`. */
export function choirErrorMessage(error: Error, fallback: string): string {
  if (!(error instanceof ApiError)) return requestFailureMessage(error, fallback)
  const codes = [error.code, ...Object.values(error.errors ?? {}).flat()]
  return codes.map((code) => code && messages[code]).find(Boolean) || requestFailureMessage(error, fallback)
}
