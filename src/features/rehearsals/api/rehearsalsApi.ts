import { apiRequest } from '@/lib/api/client'
import { parseUtc } from '@/lib/api/dates'
import { toQuery, type PagedList } from '@/lib/api/paging'
import type { Rehearsal, RehearsalFilters, RehearsalSong, RehearsalValues } from '../types'

// `/api/rehearsals` (Harmonia-BE RehearsalsController), Choir Director only: search, create, update, delete, the
// songs of a session and the suggested songs of an event. Times are sent and read as UTC.

interface RehearsalSongDto {
  songId: string
  songTitle: string
  displayOrder: number
}

interface RehearsalDto {
  id: string
  choirId: string | null
  eventId: string | null
  locationId: string | null
  locationName: string | null
  startTime: string
  endTime: string
  note: string | null
  songs: RehearsalSongDto[]
}

export interface RehearsalPage {
  pageNumber: number
  pageSize: number
}

const toSongs = (songs: RehearsalSongDto[]): RehearsalSong[] =>
  songs.toSorted((a, b) => a.displayOrder - b.displayOrder).map(({ songId, songTitle }) => ({ songId, songTitle }))

const toRehearsal = (dto: RehearsalDto): Rehearsal => ({
  id: dto.id,
  choirId: dto.choirId ?? undefined,
  eventId: dto.eventId ?? undefined,
  locationId: dto.locationId ?? undefined,
  locationName: dto.locationName ?? undefined,
  startAt: parseUtc(dto.startTime).toISOString(),
  endAt: parseUtc(dto.endTime).toISOString(),
  note: dto.note ?? undefined,
  songs: toSongs(dto.songs),
})

const toSongItems = (songs: RehearsalSong[]) => songs.map(({ songId }) => ({ songId }))

/** Newest start first. */
export async function listRehearsals(filters: RehearsalFilters, page: RehearsalPage): Promise<PagedList<Rehearsal>> {
  const result = await apiRequest<PagedList<RehearsalDto>>(`/api/rehearsals${toQuery({ ...filters, ...page })}`)
  return { ...result, items: result.items.map(toRehearsal) }
}

/**
 * Creates a rehearsal with its songs, or updates one: the details first, then the songs (PUT {id}/songs replaces
 * the whole programme). Members are notified of a change.
 */
export async function saveRehearsal({ id, values }: { id?: string; values: RehearsalValues }): Promise<void> {
  const details = {
    eventId: values.eventId,
    locationId: values.locationId,
    startTime: values.startAt,
    endTime: values.endAt,
    note: values.note,
  }
  if (!id) {
    await apiRequest<unknown>('/api/rehearsals', {
      method: 'POST',
      // D8: a new session belongs to one of the director's choirs, which must serve the program when one is chosen.
      body: JSON.stringify({ ...details, choirId: values.choirId, songs: toSongItems(values.songs) }),
    })
    return
  }
  await apiRequest<unknown>(`/api/rehearsals/${id}`, { method: 'PUT', body: JSON.stringify(details) })
  await apiRequest<unknown>(`/api/rehearsals/${id}/songs`, {
    method: 'PUT',
    body: JSON.stringify({ items: toSongItems(values.songs) }),
  })
}

/** Refused once attendance was recorded (REHEARSAL_HAS_ATTENDANCE). */
export async function deleteRehearsal(id: string): Promise<void> {
  await apiRequest<unknown>(`/api/rehearsals/${id}`, { method: 'DELETE' })
}

/** The songs of the event's approved list, once each; empty without one. Nothing is saved. */
export async function getDefaultSongs(eventId: string): Promise<RehearsalSong[]> {
  return toSongs(await apiRequest<RehearsalSongDto[]>(`/api/rehearsals/default-songs${toQuery({ eventId })}`))
}
