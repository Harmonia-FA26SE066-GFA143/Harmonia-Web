import { apiRequest } from '@/lib/api/client'
import { toQuery } from '@/lib/api/paging'
import { celebrationNameVi } from '../celebrationNames'
import type { LiturgicalDay } from '../types'

// `/api/liturgical-days` (Harmonia-BE LiturgicalDaysController): the liturgical days of a date range (at most 366 days),
// read by every signed-in role, and the Parish Priest's sync of a civil year from the Liturgical Calendar API.

interface LiturgicalDayDto {
  date: string
  celebrationName: string
  rank: string | null
  seasonName: string | null
}

/** The cached days between the two dates (YYYY-MM-DD, inclusive); a day of a year not synced yet is absent. */
export async function listLiturgicalDays(fromDate: string, toDate: string): Promise<LiturgicalDay[]> {
  const days = await apiRequest<LiturgicalDayDto[]>(`/api/liturgical-days${toQuery({ fromDate, toDate })}`)
  return days.map((dto) => ({
    date: dto.date,
    celebrationName: celebrationNameVi(dto.celebrationName),
    rank: dto.rank ?? undefined,
    seasonName: dto.seasonName ?? undefined,
  }))
}

/**
 * Fetches a civil year (1970–9999) from the Liturgical Calendar API and overwrites the cached days of that year
 * (LiturgicalDayService.SyncAsync); answers how many days the year has.
 */
export function syncLiturgicalDays(year: number): Promise<number> {
  return apiRequest<number>('/api/liturgical-days/sync', { method: 'POST', body: JSON.stringify({ year }) })
}
