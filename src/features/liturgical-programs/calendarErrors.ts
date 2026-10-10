import { ApiError } from '@/lib/api/errors'

/** Refusals of POST /api/liturgical-days/import (Harmonia-BE LiturgicalDayService.ImportAsync, CatholicCalendarParser). */
const messages: Record<string, string> = {
  CALENDAR_FILE_REQUIRED: 'Vui lòng chọn file lịch phụng vụ.',
  CALENDAR_FILE_TYPE_NOT_ALLOWED: 'Chỉ nhận file lịch .ics.',
  CALENDAR_FILE_TOO_LARGE: 'File lịch tối đa 2 MB.',
  CALENDAR_FILE_INVALID: 'File không phải lịch .ics hợp lệ.',
}

export function calendarErrorMessage(error: Error, fallback: string): string {
  return (error instanceof ApiError && error.code !== undefined && messages[error.code]) || fallback
}
