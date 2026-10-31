import { apiRequest } from '@/lib/api/client'
import { toQuery } from '@/lib/api/paging'
import type { LiturgicalDay } from '../types'

// `/api/liturgical-days` (Harmonia-BE LiturgicalDaysController): the liturgical days of a date range (at most 366 days),
// read by every signed-in role, and the Parish Priest's sync of a civil year from the Liturgical Calendar API.

// The calendar's English names stay as codes; the backend adds Vietnamese ones from the Admin's translations or known
// patterns, falling back to the English name (LiturgicalDayDto, api/liturgical-name-translations).
interface LiturgicalDayDto {
  date: string
  celebrationNameVi: string
  rankVi: string | null
  /** Advent, Christmas, Lent, Easter or OrdinaryTime (LiturgicalCalendarApiClient.ToSeason); the Triduum is Lent. */
  seasonName: string | null
  seasonNameVi: string | null
}

/** The cached days between the two dates (YYYY-MM-DD, inclusive); a day of a year not synced yet is absent. */
export async function listLiturgicalDays(fromDate: string, toDate: string): Promise<LiturgicalDay[]> {
  const days = await apiRequest<LiturgicalDayDto[]>(`/api/liturgical-days${toQuery({ fromDate, toDate })}`)
  return days.map((dto) => ({
    date: dto.date,
    celebrationName: dto.celebrationNameVi,
    rank: dto.rankVi ?? undefined,
    seasonKey: dto.seasonName ?? undefined,
    seasonName: dto.seasonNameVi ?? undefined,
  }))
}

/**
 * Fetches a civil year (1970–9999) from the Liturgical Calendar API and overwrites the cached days of that year
 * (LiturgicalDayService.SyncAsync); answers how many days the year has.
 */
export function syncLiturgicalDays(year: number): Promise<number> {
  return apiRequest<number>('/api/liturgical-days/sync', { method: 'POST', body: JSON.stringify({ year }) })
}
