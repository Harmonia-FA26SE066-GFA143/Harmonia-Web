import { errorMessage } from '@/lib/api/errors'

/** Refusals of POST /api/liturgical-days/sync (Harmonia-BE LiturgicalDayService.SyncAsync, LiturgicalCalendarApiClient). */
const messages: Record<string, string> = {
  EXTERNAL_CALENDAR_FAILED: 'Không lấy được lịch phụng vụ từ nguồn lịch trực tuyến. Vui lòng thử lại sau.',
}

export function calendarErrorMessage(error: Error, fallback: string): string {
  return errorMessage(error, messages, fallback)
}
