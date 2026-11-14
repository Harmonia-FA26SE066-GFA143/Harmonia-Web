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
  /** BE 90af733 (B45); null for days cached before it, until the year is synced again. */
  color: string | null
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
    color: dto.color ?? undefined,
  }))
}

/** An upcoming event on a day that got another celebration or rank from the sync (Harmonia-BE SyncAffectedEventDto.cs). */
export interface SyncAffectedEvent {
  eventId: string
  title?: string | null
  eventDate: string
  time: string
  previousCelebrationName?: string | null
  celebrationName?: string | null
}

/** How many days were stored, and the upcoming events on days that changed (SyncLiturgicalDaysResponse.cs). */
export interface SyncLiturgicalDaysResult {
  syncedCount: number
  affectedEvents: SyncAffectedEvent[]
}

/**
 * Fetches a civil year (1970–9999) from the Liturgical Calendar API and overwrites the cached days of that year
 * (LiturgicalDayService.cs:105, BE 36b7f0e).
 */
export function syncLiturgicalDays(year: number): Promise<SyncLiturgicalDaysResult> {
  return apiRequest<SyncLiturgicalDaysResult>('/api/liturgical-days/sync', { method: 'POST', body: JSON.stringify({ year }) })
}
