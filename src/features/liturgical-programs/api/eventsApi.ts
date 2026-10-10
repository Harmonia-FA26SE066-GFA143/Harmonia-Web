import { apiRequest } from '@/lib/api/client'
import { ApiError } from '@/lib/api/errors'
import { toQuery, type PagedList } from '@/lib/api/paging'
import type { EventFilters, EventFormValues, EventStatus, LiturgicalEvent, PreparationStatus, SongListStatus } from '../types'

// `/api/liturgical-events` (Harmonia-BE LiturgicalEventsController), Parish Priest only. `eventDate` is a DateOnly
// (YYYY-MM-DD) and `time` a TimeOnly (HH:mm:ss): calendar values in Vietnam, never parsed with `new Date()`.

export interface EventPage {
  pageNumber: number
  pageSize: number
}

type ApiEventStatus = 'Draft' | 'Published' | 'Cancelled'

const statusByApi: Record<ApiEventStatus, EventStatus> = { Draft: 'draft', Published: 'published', Cancelled: 'cancelled' }

const apiStatus = Object.fromEntries(Object.entries(statusByApi).map(([api, status]) => [status, api])) as Record<
  EventStatus,
  ApiEventStatus
>

interface LiturgicalEventDto {
  id: string
  eventDate: string
  time: string
  liturgicalSeasonId: string | null
  massTypeId: string | null
  ceremonyTypeId: string | null
  categoryId: string | null
  locationId: string
  locationName: string
  title: string | null
  specialRequirements: string | null
  status: ApiEventStatus
  publishedAt: string | null
}

const toEvent = (dto: LiturgicalEventDto): LiturgicalEvent => ({
  id: dto.id,
  date: dto.eventDate,
  time: dto.time.slice(0, 5),
  title: dto.title ?? undefined,
  locationId: dto.locationId,
  locationName: dto.locationName,
  seasonId: dto.liturgicalSeasonId ?? undefined,
  massTypeId: dto.massTypeId ?? undefined,
  ceremonyTypeId: dto.ceremonyTypeId ?? undefined,
  categoryId: dto.categoryId ?? undefined,
  specialRequirements: dto.specialRequirements ?? undefined,
  status: statusByApi[dto.status],
  publishedAt: dto.publishedAt ?? undefined,
})

const toBody = (values: EventFormValues) =>
  JSON.stringify({
    eventDate: values.date,
    time: `${values.time}:00`,
    locationId: values.locationId,
    liturgicalSeasonId: values.seasonId,
    massTypeId: values.massTypeId,
    ceremonyTypeId: values.ceremonyTypeId,
    categoryId: values.categoryId,
    title: values.title,
    specialRequirements: values.specialRequirements,
  })

/** Ordered by date then time on the server. */
export async function listEvents(filters: EventFilters, page: EventPage): Promise<PagedList<LiturgicalEvent>> {
  const result = await apiRequest<PagedList<LiturgicalEventDto>>(
    `/api/liturgical-events${toQuery({
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      status: filters.status && apiStatus[filters.status],
      ...page,
    })}`,
  )
  return { ...result, items: result.items.map(toEvent) }
}

/** `null` for EVENT_NOT_FOUND (404), so the page can show its not-found state. */
export async function getEvent(id: string): Promise<LiturgicalEvent | null> {
  try {
    return toEvent(await apiRequest<LiturgicalEventDto>(`/api/liturgical-events/${id}`))
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

/** A new event starts as a Draft that nobody else sees. */
export async function createEvent(values: EventFormValues): Promise<LiturgicalEvent> {
  return toEvent(await apiRequest<LiturgicalEventDto>('/api/liturgical-events', { method: 'POST', body: toBody(values) }))
}

/** Replaces every field; refused for a cancelled event (EVENT_CANCELLED). */
export async function updateEvent(id: string, values: EventFormValues): Promise<LiturgicalEvent> {
  return toEvent(
    await apiRequest<LiturgicalEventDto>(`/api/liturgical-events/${id}`, { method: 'PUT', body: toBody(values) }),
  )
}

/**
 * Draft → Published; the backend notifies Choir Directors and members. The answer is not used: it lacks the
 * location name (LiturgicalEventService.PublishAsync), so callers reload the event instead.
 */
export async function publishEvent(id: string): Promise<void> {
  await apiRequest<unknown>(`/api/liturgical-events/${id}/publish`, { method: 'PATCH' })
}

/** Refused once the date has passed (EVENT_ALREADY_PASSED); members are notified if it was published. */
export async function cancelEvent(id: string): Promise<void> {
  await apiRequest<unknown>(`/api/liturgical-events/${id}/cancel`, { method: 'PATCH' })
}

type ApiSongListStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | 'NeedsRevision'

const songListStatusByApi: Record<ApiSongListStatus, SongListStatus> = {
  Draft: 'draft',
  Submitted: 'submitted',
  Approved: 'approved',
  Rejected: 'rejected',
  NeedsRevision: 'needsRevision',
}

interface EventPreparationStatusDto {
  songListStatus: ApiSongListStatus | null
  participationInvited: number
  participationConfirmed: number
  participationDeclined: number
  participationUnsure: number
  rosterStatus: 'Draft' | 'Suggested' | 'Finalized' | null
  rosterActiveAssignments: number
  rosterShortages: { songTitle: string; skillName: string; requiredCount: number; assignedCount: number }[] | null
  rehearsalsTotal: number
  rehearsalsHeld: number
  attendanceExpected: number
  attendancePresent: number
  practiceExpected: number
  practicePassed: number
  practiceOverdue: number
}

/** Counts across the choir for one event (EventPreparationService.GetStatusAsync). */
export async function getPreparationStatus(id: string): Promise<PreparationStatus> {
  const dto = await apiRequest<EventPreparationStatusDto>(`/api/liturgical-events/${id}/preparation-status`)
  return {
    songListStatus: dto.songListStatus ? songListStatusByApi[dto.songListStatus] : undefined,
    participation: {
      invited: dto.participationInvited,
      confirmed: dto.participationConfirmed,
      declined: dto.participationDeclined,
      unsure: dto.participationUnsure,
    },
    rosterFinalized: dto.rosterStatus ? dto.rosterStatus === 'Finalized' : undefined,
    rosterActiveAssignments: dto.rosterActiveAssignments,
    rosterShortages: dto.rosterShortages?.map(({ songTitle, skillName, requiredCount, assignedCount }) => ({
      songTitle,
      skillName,
      requiredCount,
      assignedCount,
    })),
    rehearsalsTotal: dto.rehearsalsTotal,
    rehearsalsHeld: dto.rehearsalsHeld,
    attendanceExpected: dto.attendanceExpected,
    attendancePresent: dto.attendancePresent,
    practiceExpected: dto.practiceExpected,
    practicePassed: dto.practicePassed,
    practiceOverdue: dto.practiceOverdue,
  }
}
