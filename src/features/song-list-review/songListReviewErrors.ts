import { ApiError } from '@/lib/api/errors'

/** Refusals of POST /api/song-lists/{id}/review (Harmonia-BE SongListService.ReviewAsync). The data is reloaded. */
const messages: Record<string, string> = {
  SONG_LIST_NOT_SUBMITTED: 'Danh sách không còn chờ duyệt. Thông tin đã được tải lại.',
  SONG_LIST_NOT_FOUND: 'Danh sách không còn tồn tại. Thông tin đã được tải lại.',
}

export function reviewErrorMessage(error: Error, fallback: string): string {
  return (error instanceof ApiError && error.code !== undefined && messages[error.code]) || fallback
}
