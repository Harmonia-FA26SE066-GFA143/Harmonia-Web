import { ApiError } from '@/lib/api/errors'

/** `/api/liturgical-events` refusals (Harmonia-BE LiturgicalEventService, LookupService.CheckEventCatalogsAsync). */
const messages: Record<string, string> = {
  LITURGICAL_EVENT_NOT_FOUND: 'Sự kiện không còn tồn tại. Vui lòng tải lại trang.',
  LITURGICAL_EVENT_SLOT_TAKEN: 'Đã có sự kiện khác cùng ngày, giờ và nơi cử hành.',
  LITURGICAL_EVENT_ALREADY_PUBLISHED: 'Sự kiện đã được công bố.',
  LITURGICAL_EVENT_CANCELLED: 'Sự kiện đã bị hủy, không thể thay đổi.',
  LITURGICAL_EVENT_ALREADY_PASSED: 'Sự kiện đã diễn ra, không thể hủy.',
  LITURGICAL_EVENT_DATE_OUTSIDE_LITURGICAL_SEASON: 'Ngày cử hành không nằm trong mùa phụng vụ đã chọn.',
  LOOKUP_INACTIVE: 'Có mục đã chọn (mùa, loại lễ, danh mục hoặc nơi cử hành) đã ngừng dùng. Vui lòng chọn mục khác.',
  LOOKUP_NOT_FOUND: 'Có mục đã chọn không còn tồn tại. Vui lòng tải lại trang.',
}

export function eventErrorMessage(error: Error, fallback: string): string {
  return (error instanceof ApiError && error.code !== undefined && messages[error.code]) || fallback
}
