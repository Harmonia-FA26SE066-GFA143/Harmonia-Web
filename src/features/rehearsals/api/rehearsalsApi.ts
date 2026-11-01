import { apiRequest } from '@/lib/api/client'
import { parseUtc } from '@/lib/api/dates'
import { toQuery, type PagedList } from '@/lib/api/paging'
import type { RecordingValues, Rehearsal, RehearsalFilters, RehearsalRecording, RehearsalSong, RehearsalValues } from '../types'

// `/api/rehearsals` (Harmonia-BE RehearsalsController), Choir Director only: search, create, update, delete, the
// songs of a session and the suggested songs of an event. Times are sent and read as UTC.

interface RehearsalSongDto {
  songId: string
  songTitle: string
  displayOrder: number
  note: string | null
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
  songs
    .toSorted((a, b) => a.displayOrder - b.displayOrder)
    .map(({ songId, songTitle, note }) => ({ songId, songTitle, note: note ?? undefined }))

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

const toSongItems = (songs: RehearsalSong[]) => songs.map(({ songId, note }) => ({ songId, note }))

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

/**
 * One rehearsal by id (GET /api/schedule/rehearsals/{id}, any signed-in role; a director sees the rehearsals of the
 * choirs they lead, 404 REHEARSAL_NOT_FOUND otherwise). It carries no choir, program or location id.
 */
export async function getRehearsal(id: string): Promise<Rehearsal> {
  const dto = await apiRequest<Omit<RehearsalDto, 'choirId' | 'eventId' | 'locationId'>>(`/api/schedule/rehearsals/${id}`)
  return toRehearsal({ ...dto, choirId: null, eventId: null, locationId: null })
}

/** The songs of the event's approved list, once each; empty without one. Nothing is saved. */
export async function getDefaultSongs(eventId: string): Promise<RehearsalSong[]> {
  return toSongs(await apiRequest<RehearsalSongDto[]>(`/api/rehearsals/default-songs${toQuery({ eventId })}`))
}

interface RehearsalRecordingDto {
  id: string
  songId: string | null
  title: string | null
  fileSizeBytes: number
  durationSeconds: number | null
  audioUrl: string
  createdAt: string
}

// `/api/rehearsals/{id}/recordings` (BE 90af733, RehearsalsController.cs:83-109): the Choir Director records and deletes
// takes of a rehearsal of their choirs; `.webm`, `.ogg`, `.m4a`, `.mp3`, `.wav`, at most 20 MB.

/** Every take of the rehearsal. */
export async function listRecordings(rehearsalId: string): Promise<RehearsalRecording[]> {
  const dtos = await apiRequest<RehearsalRecordingDto[]>(`/api/rehearsals/${rehearsalId}/recordings`)
  return dtos.map(({ songId, title, durationSeconds, ...rest }) => ({
    ...rest,
    songId: songId ?? undefined,
    title: title ?? undefined,
    durationSeconds: durationSeconds ?? undefined,
  }))
}

export async function createRecording(rehearsalId: string, { file, songId, title, durationSeconds }: RecordingValues): Promise<void> {
  const form = new FormData()
  form.append('file', file)
  if (songId) form.append('songId', songId)
  if (title) form.append('title', title)
  // CreateRehearsalRecordingRequestValidator: 1–14 400 seconds when given.
  if (durationSeconds) form.append('durationSeconds', String(Math.min(14_400, Math.max(1, durationSeconds))))
  await apiRequest<unknown>(`/api/rehearsals/${rehearsalId}/recordings`, { method: 'POST', body: form })
}

export async function deleteRecording(rehearsalId: string, recordingId: string): Promise<void> {
  await apiRequest<unknown>(`/api/rehearsals/${rehearsalId}/recordings/${recordingId}`, { method: 'DELETE' })
}
