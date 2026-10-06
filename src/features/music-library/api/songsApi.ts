import { env } from '@/config/env'
import { apiRequest } from '@/lib/api/client'
import { ApiContractMissingError, ApiError } from '@/lib/api/errors'
import { toQuery, type PagedList } from '@/lib/api/paging'
import type { MaterialKind, Song, SongClassification, SongFilters, SongMaterial, SongValues } from '../types'

// Songs: `/api/songs` (Harmonia-BE SongsController). Every role reads; only the Choir Director writes.

export interface SongPage {
  pageNumber: number
  pageSize: number
}

export function listSongs(filters: SongFilters, page: SongPage): Promise<PagedList<Song>> {
  return apiRequest<PagedList<Song>>(
    `/api/songs${toQuery({
      keyword: filters.search.trim(),
      liturgicalSeasonId: filters.seasonId,
      massTypeId: filters.massTypeId,
      ceremonyTypeId: filters.ceremonyTypeId,
      songThemeId: filters.themeId,
      skillId: filters.skillId,
      ...page,
    })}`,
  )
}

/** `null` for SONG_NOT_FOUND (404), so the page can show its not-found state. */
async function orNullWhenMissing<T>(request: Promise<T>): Promise<T | null> {
  try {
    return await request
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export function getSong(id: string): Promise<Song | null> {
  return orNullWhenMissing(apiRequest<Song>(`/api/songs/${id}`))
}

export function getSongClassification(id: string): Promise<SongClassification | null> {
  return orNullWhenMissing(apiRequest<SongClassification>(`/api/songs/${id}/classification`))
}

export function createSong(values: SongValues): Promise<Song> {
  return apiRequest<Song>('/api/songs', { method: 'POST', body: JSON.stringify(values) })
}

export function updateSong(id: string, values: SongValues): Promise<Song> {
  return apiRequest<Song>(`/api/songs/${id}`, { method: 'PUT', body: JSON.stringify(values) })
}

// Materials: `/api/music-materials` exists but is wired in issue #41 (multipart upload, paging, PascalCase types).
// Until then each function checks `import.meta.env.DEV` at the call site so the fixture import is dropped from dist/.

export async function listMaterials(songId: string): Promise<SongMaterial[]> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { listMaterialsFixture } = await import('./fixtures.dev')
    return listMaterialsFixture(songId)
  }
  throw new ApiContractMissingError('Xem tài liệu bài hát')
}

export async function uploadMaterial(songId: string, kind: MaterialKind, file: File): Promise<SongMaterial> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { uploadMaterialFixture } = await import('./fixtures.dev')
    return uploadMaterialFixture(songId, kind, file)
  }
  throw new ApiContractMissingError('Tải lên tài liệu bài hát')
}

/** Deletes a material; FE-54 records deleted materials in the activity history. */
export async function deleteMaterial(songId: string, materialId: string): Promise<void> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { deleteMaterialFixture } = await import('./fixtures.dev')
    return deleteMaterialFixture(songId, materialId)
  }
  throw new ApiContractMissingError('Xoá tài liệu bài hát')
}
