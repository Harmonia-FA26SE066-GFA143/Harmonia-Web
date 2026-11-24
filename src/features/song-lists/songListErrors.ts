import { errorMessage } from '@/lib/api/errors'

/** Refusals of saving and submitting a song list (Harmonia-BE SongListService, Create/UpdateSongListItemsRequestValidator). */
const messages: Record<string, string> = {
  // D8: only the director of the lead choir plans a program served by several choirs.
  CHOIR_NOT_LEAD: 'Chỉ ca trưởng của ca đoàn phụ trách chương trình mới làm được việc này.',
  SONG_LIST_EMPTY: 'Thêm ít nhất một bài hát.',
  SONG_LIST_SLOT_DUPLICATE: 'Một bài hát chỉ được chọn một lần trong cùng một phần phụng vụ.',
  SONG_LIST_NOT_EDITABLE: 'Danh sách không còn là bản nháp. Thông tin đã được tải lại.',
  SONG_LIST_NOT_LATEST_VERSION: 'Danh sách đã có phiên bản mới hơn. Thông tin đã được tải lại.',
  SONG_LIST_ALREADY_SUBMITTED: 'Danh sách đã được gửi duyệt. Thông tin đã được tải lại.',
  SONG_LIST_CANNOT_BE_REVISED: 'Danh sách đang chờ duyệt hoặc đang là bản nháp. Thông tin đã được tải lại.',
  SONG_LIST_EVENT_HAS_APPROVED_VERSION: 'Chương trình đã có danh sách được phê duyệt. Thông tin đã được tải lại.',
  SONG_LIST_NOT_FOUND: 'Danh sách không còn tồn tại. Thông tin đã được tải lại.',
  SONG_NOT_FOUND: 'Có bài hát đã chọn không còn trong kho.',
  SONG_INACTIVE: 'Có bài hát đã chọn đã bị xoá khỏi kho.',
  SLOT_NOT_FOUND: 'Có phần phụng vụ đã chọn không còn tồn tại.',
  LOOKUP_INACTIVE: 'Có phần phụng vụ đã chọn đã ngừng dùng.',
  LITURGICAL_EVENT_NOT_FOUND: 'Chương trình không còn tồn tại.',
  LITURGICAL_EVENT_CANCELLED: 'Chương trình đã bị hủy, danh sách bài hát chỉ còn xem.',
  // BE 61b3aa6: closed once the Mass has begun.
  LITURGICAL_EVENT_ALREADY_PASSED: 'Thánh lễ đã bắt đầu, danh sách bài hát chỉ còn xem.',
  LITURGICAL_EVENT_NOT_PUBLISHED: 'Chương trình chưa được công bố.',
}

/** The message of the error code, or of the first field error code (400 VALIDATION_FAILED), else `fallback`. */
export function songListErrorMessage(error: Error, fallback: string): string {
  return errorMessage(error, messages, fallback)
}
