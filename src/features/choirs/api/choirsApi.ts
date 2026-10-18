import { apiRequest } from '@/lib/api/client'
import type { Choir, ChoirMembership, ChoirValues } from '../types'

// `/api/choirs` and `/api/liturgical-events/{id}/choirs` (Harmonia-BE ChoirsController, LiturgicalEventsController),
// Choir Director only (D7: several choirs). Choirs come back ordered by name.

interface ChoirDto {
  id: string
  name: string
  description: string | null
  isActive: boolean
}

const toChoir = ({ id, name, description, isActive }: ChoirDto): Choir => ({
  id,
  name,
  description: description ?? undefined,
  isActive,
})

const toBody = ({ name, description, isActive }: ChoirValues) =>
  JSON.stringify({ name: name.trim(), description: description?.trim() || undefined, isActive })

/** Every choir, switched-off ones included. */
export async function listChoirs(): Promise<Choir[]> {
  return (await apiRequest<ChoirDto[]>('/api/choirs')).map(toChoir)
}

/** Creates a choir (always active), or updates one when `id` is given. */
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

export async function listEventChoirs(eventId: string): Promise<Choir[]> {
  return (await apiRequest<ChoirDto[]>(`/api/liturgical-events/${eventId}/choirs`)).map(toChoir)
}

/** Replaces the choirs serving the event; an empty list removes them all. */
export async function updateEventChoirs(eventId: string, choirIds: string[]): Promise<Choir[]> {
  return (
    await apiRequest<ChoirDto[]>(`/api/liturgical-events/${eventId}/choirs`, { method: 'PUT', body: JSON.stringify({ choirIds }) })
  ).map(toChoir)
}
