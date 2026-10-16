import { apiRequest } from '@/lib/api/client'
import { toQuery } from '@/lib/api/paging'
import type { ParticipationRequest, ParticipationResponse } from '../types'

// `/api/event-participations` (Harmonia-BE EventParticipationsController), the Choir Director's side: the requests
// of an event with their answers, and new requests. A member is asked once per event.

type ApiStatus = 'Invited' | 'Confirmed' | 'Declined' | 'Unsure'

const responseByApi: Record<ApiStatus, ParticipationResponse | undefined> = {
  Invited: undefined,
  Confirmed: 'confirmed',
  Declined: 'declined',
  Unsure: 'unsure',
}

interface EventParticipationDto {
  id: string
  memberId: string
  memberFullName: string
  status: ApiStatus
  requestedAt: string
  respondedAt: string | null
  note: string | null
}

/** Every request of the event, empty when none was sent. The counts of the answer are worked out by the page. */
export async function getParticipation(eventId: string): Promise<ParticipationRequest[]> {
  const summary = await apiRequest<{ items: EventParticipationDto[] }>(`/api/event-participations${toQuery({ eventId })}`)
  return summary.items.map((dto) => ({
    id: dto.id,
    memberId: dto.memberId,
    fullName: dto.memberFullName,
    requestedAt: dto.requestedAt,
    response: responseByApi[dto.status],
    respondedAt: dto.respondedAt ?? undefined,
    note: dto.note ?? undefined,
  }))
}

/** Asks the given members, none of whom may have been asked for this event (EVENT_PARTICIPATION_ALREADY_REQUESTED). */
export async function sendParticipationRequests(eventId: string, memberIds: string[]): Promise<void> {
  await apiRequest<unknown>('/api/event-participations', { method: 'POST', body: JSON.stringify({ eventId, memberIds }) })
}
