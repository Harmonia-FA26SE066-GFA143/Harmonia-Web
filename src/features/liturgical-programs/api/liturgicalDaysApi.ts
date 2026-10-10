import { apiRequest } from '@/lib/api/client'
import { ApiError } from '@/lib/api/errors'
import type { LiturgicalDay } from '../types'

// `/api/liturgical-days` (Harmonia-BE LiturgicalDaysController): the liturgical day of one date, read by every signed-in
// role, and the Parish Priest's import of a Catholic calendar feed (.ics). There is no read over a date range.

interface LiturgicalDayDto {
  date: string
  celebrationName: string
  rank: string | null
  seasonName: string | null
}

/** `null` while the date has not been imported (404 CALENDAR_DAY_NOT_FOUND). `date` is YYYY-MM-DD. */
export async function getLiturgicalDay(date: string): Promise<LiturgicalDay | null> {
  try {
    const dto = await apiRequest<LiturgicalDayDto>(`/api/liturgical-days/${date}`)
    return { date: dto.date, celebrationName: dto.celebrationName, rank: dto.rank ?? undefined, seasonName: dto.seasonName ?? undefined }
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

/** Adds the days of the file not cached yet and returns how many; days already imported are kept as they are. */
export function importLiturgicalCalendar(file: File): Promise<number> {
  const form = new FormData()
  form.append('file', file)
  return apiRequest<number>('/api/liturgical-days/import', { method: 'POST', body: form })
}
