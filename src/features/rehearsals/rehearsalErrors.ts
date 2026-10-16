import { ApiError } from '@/lib/api/errors'

/** Refusals of `/api/rehearsals` the Choir Director can act on (Harmonia-BE RehearsalService, RehearsalSongService). */
const messages: Record<string, string> = {
  REHEARSAL_NOT_FOUND: 'Buổi tập không còn tồn tại. Lịch tập đã được tải lại.',
  REHEARSAL_ALREADY_PASSED: 'Buổi tập đã kết thúc, không sửa được nữa.',
  REHEARSAL_HAS_ATTENDANCE: 'Buổi tập đã có điểm danh nên không thể xoá.',
  REHEARSAL_TIME_INVALID: 'Giờ kết thúc phải sau giờ bắt đầu.',
  REHEARSAL_TIME_CONFLICT: 'Địa điểm đã có buổi tập khác trùng giờ.',
  REHEARSAL_SONG_DUPLICATE: 'Mỗi bài hát chỉ chọn một lần.',
  LOOKUP_NOT_FOUND: 'Địa điểm đã chọn không còn tồn tại.',
  LOOKUP_INACTIVE: 'Địa điểm đã chọn đã ngừng dùng.',
  LITURGICAL_EVENT_NOT_FOUND: 'Chương trình đã chọn không còn tồn tại.',
  LITURGICAL_EVENT_CANCELLED: 'Chương trình đã chọn đã bị hủy.',
  SONG_NOT_FOUND: 'Có bài hát đã chọn không còn trong kho.',
  SONG_INACTIVE: 'Có bài hát đã chọn đã bị xoá khỏi kho.',
}

/** The message of the error code, or of the first field error code (400 VALIDATION_FAILED), else `fallback`. */
export function rehearsalErrorMessage(error: Error, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback
  const codes = [error.code, ...Object.values(error.errors ?? {}).flat()]
  return codes.map((code) => code && messages[code]).find(Boolean) || fallback
}
