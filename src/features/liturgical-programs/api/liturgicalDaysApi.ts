import { apiRequest } from '@/lib/api/client'
import { toQuery } from '@/lib/api/paging'
import type { LiturgicalDay } from '../types'

// `/api/liturgical-days` (Harmonia-BE LiturgicalDaysController): the liturgical days of a date range (at most 366 days),
// read by every signed-in role, and the Parish Priest's import of a Catholic calendar feed (.ics).

interface LiturgicalDayDto {
  date: string
  celebrationName: string
  rank: string | null
  seasonName: string | null
}

/** The imported days between the two dates (YYYY-MM-DD, inclusive); a day not imported yet is absent. */
export async function listLiturgicalDays(fromDate: string, toDate: string): Promise<LiturgicalDay[]> {
  const days = await apiRequest<LiturgicalDayDto[]>(`/api/liturgical-days${toQuery({ fromDate, toDate })}`)
  return days.map((dto) => ({
    date: dto.date,
    celebrationName: dto.celebrationName,
    rank: dto.rank ?? undefined,
    seasonName: dto.seasonName ?? undefined,
  }))
}

/** Adds the days of the file not cached yet and returns how many; days already imported are kept as they are. */
export function importLiturgicalCalendar(file: File): Promise<number> {
  const form = new FormData()
  form.append('file', file)
  return apiRequest<number>('/api/liturgical-days/import', { method: 'POST', body: form })
}
