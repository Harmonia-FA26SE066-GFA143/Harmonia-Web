import { errorMessage } from '@/lib/api/errors'

/** Refusals of POST /api/song-lists/{id}/review (Harmonia-BE SongListService.ReviewAsync). The data is reloaded. */
const messages: Record<string, string> = {
  SONG_LIST_NOT_SUBMITTED: 'Danh sách không còn chờ duyệt. Thông tin đã được tải lại.',
  SONG_LIST_NOT_FOUND: 'Danh sách không còn tồn tại. Thông tin đã được tải lại.',
  // BE 61b3aa6: no review once the event is cancelled or its Mass has begun.
  LITURGICAL_EVENT_CANCELLED: 'Chương trình đã bị hủy, danh sách không còn duyệt được.',
  LITURGICAL_EVENT_ALREADY_PASSED: 'Thánh lễ đã bắt đầu, danh sách không còn duyệt được.',
}

export function reviewErrorMessage(error: Error, fallback: string): string {
  return errorMessage(error, messages, fallback)
}
