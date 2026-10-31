import { apiRequest } from '@/lib/api/client'
import { ApiError } from '@/lib/api/errors'
import { toQuery, type PagedList } from '@/lib/api/paging'
import type { EventFilters, LiturgicalProgram, LiturgicalProgramDetail, SongCredits } from '../types'
import {
  apiStatus,
  songListStatusByApi,
  statusByApi,
  type ApiEventStatus,
  type ApiSongListStatus,
  type EventPage,
} from './eventsApi'

// The Choir Director's programs: `GET /api/liturgical-events` lists every event but drafts (Harmonia-BE
// LiturgicalEventsController.SearchAsync), `GET /api/schedule/events/{id}` reads a published one, and
// `GET /api/song-lists/event/{eventId}/latest` its newest song list, drafts included.

interface ProgramFields {
  id: string
  eventDate: string
  time: string
  title: string | null
  locationName: string
  liturgicalSeasonName: string | null
  massTypeName: string | null
  ceremonyTypeName: string | null
  specialRequirements: string | null
}

interface EventListItemDto extends ProgramFields {
  status: ApiEventStatus
  latestSongListStatus: ApiSongListStatus | null
}

interface SongListDto {
  status: ApiSongListStatus
  items: { id: string; songId: string; songTitle: string; slotName: string; displayOrder: number; note: string | null }[]
}

const toProgram = (dto: ProgramFields, status: ApiEventStatus, songListStatus: ApiSongListStatus | null): LiturgicalProgram => ({
  id: dto.id,
  eventName: dto.title || dto.massTypeName || dto.ceremonyTypeName || 'Sự kiện phụng vụ',
  date: dto.eventDate,
  time: dto.time.slice(0, 5),
  locationName: dto.locationName,
  status: statusByApi[status],
  seasonName: dto.liturgicalSeasonName ?? undefined,
  massTypeName: dto.massTypeName ?? undefined,
  ceremonyTypeName: dto.ceremonyTypeName ?? undefined,
  specialRequirements: dto.specialRequirements ?? undefined,
  songListStatus: songListStatus ? songListStatusByApi[songListStatus] : undefined,
})

/** Ordered by date then time on the server. */
export async function listPrograms(filters: EventFilters, page: EventPage): Promise<PagedList<LiturgicalProgram>> {
  const result = await apiRequest<PagedList<EventListItemDto>>(
    `/api/liturgical-events${toQuery({
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      status: filters.status && apiStatus[filters.status],
      ...page,
    })}`,
  )
  return { ...result, items: result.items.map((dto) => toProgram(dto, dto.status, dto.latestSongListStatus)) }
}

const orNullOn404 = <T>(request: Promise<T>): Promise<T | null> =>
  request.catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  })

/** `null` when the event does not exist or is not published (404 LITURGICAL_EVENT_NOT_FOUND). */
export async function getProgram(id: string): Promise<LiturgicalProgramDetail | null> {
  const [event, songList] = await Promise.all([
    orNullOn404(apiRequest<ProgramFields>(`/api/schedule/events/${id}`)),
    orNullOn404(apiRequest<SongListDto>(`/api/song-lists/event/${id}/latest`)),
  ])
  if (!event) return null
  return {
    ...toProgram(event, 'Published', songList?.status ?? null),
    // The backend does not order the items.
    songs: (songList?.items ?? [])
      .toSorted((a, b) => a.displayOrder - b.displayOrder)
      .map(({ id: itemId, songId, songTitle, slotName, note }) => ({ id: itemId, songId, title: songTitle, liturgicalPart: slotName, note: note ?? undefined })),
  }
}

interface SongCreditsDto {
  composer: string | null
  lyricist: string | null
  materialCounts: Record<string, number>
}

/**
 * Composer, lyricist and attached material count of one song (`GET /api/songs/{id}`, every role), for the program's
 * reading list. ponytail: a call per listed song; the song-list item carries only the title (SongListItemDto).
 */
export async function getSongCredits(songId: string): Promise<SongCredits> {
  const dto = await apiRequest<SongCreditsDto>(`/api/songs/${songId}`)
  return {
    composer: dto.composer ?? undefined,
    lyricist: dto.lyricist ?? undefined,
    materials: Object.values(dto.materialCounts).reduce((total, count) => total + count, 0),
  }
}
