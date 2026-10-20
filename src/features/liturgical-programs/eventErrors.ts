import { errorMessage } from '@/lib/api/errors'

/**
 * `/api/liturgical-events` refusals (Harmonia-BE LiturgicalEventService, LookupService.CheckEventCatalogsAsync). Since BE
 * 2100688 publishing checks the event again, so a catalog switched off after the last save also stops it.
 */
const messages: Record<string, string> = {
  LITURGICAL_EVENT_NOT_FOUND: 'Sự kiện không còn tồn tại. Vui lòng tải lại trang.',
  LITURGICAL_EVENT_SLOT_TAKEN: 'Đã có sự kiện khác cùng ngày, giờ và nơi cử hành.',
  LITURGICAL_EVENT_ALREADY_PUBLISHED: 'Sự kiện đã được công bố.',
  LITURGICAL_EVENT_CANCELLED: 'Sự kiện đã bị hủy, không thể thay đổi.',
  LITURGICAL_EVENT_ALREADY_PASSED: 'Sự kiện đã qua ngày cử hành, không thể thay đổi.',
  LITURGICAL_EVENT_DATE_OUTSIDE_LITURGICAL_SEASON: 'Ngày cử hành không nằm trong mùa phụng vụ đã chọn.',
  // Publishing rechecks the event and answers these two directly, not inside VALIDATION_FAILED.
  LITURGICAL_EVENT_TYPE_REQUIRED: 'Chọn loại lễ hoặc loại nghi thức cho sự kiện (bấm Sửa) rồi công bố lại.',
  LITURGICAL_EVENT_SEASON_REQUIRED: 'Chọn mùa phụng vụ cho sự kiện (bấm Sửa) rồi công bố lại.',
  LOOKUP_INACTIVE: 'Có mục đã chọn (mùa, loại lễ, danh mục hoặc nơi cử hành) đã ngừng dùng. Vui lòng chọn mục khác.',
  LOOKUP_NOT_FOUND: 'Có mục đã chọn không còn tồn tại. Vui lòng tải lại trang.',
}

export function eventErrorMessage(error: Error, fallback: string): string {
  return errorMessage(error, messages, fallback)
}
