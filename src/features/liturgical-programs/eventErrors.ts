import { ApiError } from '@/lib/api/errors'

/** `/api/liturgical-events` refusals (Harmonia-BE LiturgicalEventService, ErrorStatusMap: 404 / 409). */
const messages: Record<string, string> = {
  EVENT_NOT_FOUND: 'Sự kiện không còn tồn tại. Vui lòng tải lại trang.',
  EVENT_SLOT_TAKEN: 'Đã có sự kiện khác cùng ngày, giờ và nơi cử hành.',
  EVENT_ALREADY_PUBLISHED: 'Sự kiện đã được công bố.',
  EVENT_CANCELLED: 'Sự kiện đã bị hủy, không thể thay đổi.',
  EVENT_ALREADY_PASSED: 'Sự kiện đã diễn ra, không thể hủy.',
}

export function eventErrorMessage(error: Error, fallback: string): string {
  return (error instanceof ApiError && error.code !== undefined && messages[error.code]) || fallback
}
