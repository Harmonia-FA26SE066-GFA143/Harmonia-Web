import { apiRequest } from '@/lib/api/client'
import type { Choir, ChoirMembership, ChoirValues, EventChoir } from '../types'

// `/api/choirs` and `/api/liturgical-events/{id}/choirs` (Harmonia-BE ChoirsController, LiturgicalEventsController,
// D7, D8). The Admin creates and edits choirs; a Choir Director lists only their own. Members: Admin and Choir Director.
// The Parish Priest sets the choirs serving an event and the lead one. Choirs come back ordered by name.

interface ChoirDto {
  id: string
  name: string
  description: string | null
  isActive: boolean
  directorId: string | null
  directorFullName: string | null
}

const toChoir = ({ id, name, description, isActive, directorId, directorFullName }: ChoirDto): Choir => ({
  id,
  name,
  description: description ?? undefined,
  isActive,
  directorId: directorId ?? undefined,
  directorName: directorFullName ?? undefined,
})

// PUT replaces every field: a missing director is sent as null, which removes the director.
const toBody = ({ name, description, isActive, directorId }: ChoirValues) =>
  JSON.stringify({ name: name.trim(), description: description?.trim() || undefined, isActive, directorId: directorId ?? null })

/** Every choir, switched-off ones included. */
export async function listChoirs(): Promise<Choir[]> {
  return (await apiRequest<ChoirDto[]>('/api/choirs')).map(toChoir)
}

/** Admin: creates a choir (always active), or updates one when `id` is given. */
export async function saveChoir({ id, values }: { id?: string; values: ChoirValues }): Promise<Choir> {
  return toChoir(
    await apiRequest<ChoirDto>(id ? `/api/choirs/${id}` : '/api/choirs', { method: id ? 'PUT' : 'POST', body: toBody(values) }),
  )
}

/** The choir's current members, by name. */
export function listMembersOfChoir(choirId: string): Promise<ChoirMembership[]> {
  return apiRequest<ChoirMembership[]>(`/api/choirs/${choirId}/members`)
}

/** Adds active members; members already in the choir are skipped and members who left rejoin. */
export async function addChoirMembers(choirId: string, memberIds: string[]): Promise<void> {
  await apiRequest<unknown>(`/api/choirs/${choirId}/members`, { method: 'POST', body: JSON.stringify({ memberIds }) })
}

/** The member leaves the choir; the membership is kept as history. */
export async function removeChoirMember(choirId: string, memberId: string): Promise<void> {
  await apiRequest<unknown>(`/api/choirs/${choirId}/members/${memberId}`, { method: 'DELETE' })
}

interface EventChoirDto {
  choirId: string
  name: string
  isActive: boolean
  isLead: boolean
  directorId: string | null
  directorFullName: string | null
}

const toEventChoir = ({ directorId, directorFullName, ...rest }: EventChoirDto): EventChoir => ({
  ...rest,
  directorId: directorId ?? undefined,
  directorName: directorFullName ?? undefined,
})

/** The lead choir first, then by name (Parish Priest, Choir Director). */
export async function listEventChoirs(eventId: string): Promise<EventChoir[]> {
  return (await apiRequest<EventChoirDto[]>(`/api/liturgical-events/${eventId}/choirs`)).map(toEventChoir)
}

/**
 * Parish Priest: replaces the choirs serving the event; an empty list removes them all. The lead choir is required
 * while there are choirs and must be one of them (CHOIR_LEAD_INVALID).
 */
export async function updateEventChoirs(eventId: string, value: { choirIds: string[]; leadChoirId?: string }): Promise<EventChoir[]> {
  const body = JSON.stringify({ choirIds: value.choirIds, leadChoirId: value.choirIds.length > 0 ? value.leadChoirId : undefined })
  return (await apiRequest<EventChoirDto[]>(`/api/liturgical-events/${eventId}/choirs`, { method: 'PUT', body })).map(toEventChoir)
}
