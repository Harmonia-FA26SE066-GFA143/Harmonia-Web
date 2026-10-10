import { ApiError } from '@/lib/api/errors'

/** Refusals of POST /api/director-notes (Harmonia-BE DirectorNoteService, CreateDirectorNoteRequestValidator). */
const messages: Record<string, string> = {
  DIRECTOR_NOTE_RECIPIENT_INVALID: 'Có Ca trưởng đã chọn không còn hoạt động. Danh sách người nhận đã được tải lại.',
  DIRECTOR_NOTE_TARGET_REQUIRED: 'Chọn ngày hoặc sự kiện cho ghi chú.',
  EVENT_NOT_FOUND: 'Sự kiện đã chọn không còn tồn tại.',
}

export function noteErrorMessage(error: Error, fallback: string): string {
  return (error instanceof ApiError && error.code !== undefined && messages[error.code]) || fallback
}
