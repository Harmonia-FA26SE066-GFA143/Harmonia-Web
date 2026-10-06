import { apiRequest } from '@/lib/api/client'
import { ApiError } from '@/lib/api/errors'
import { toQuery, type PagedList } from '@/lib/api/paging'
import type {
  MaterialKind,
  Song,
  SongClassification,
  SongClassificationValues,
  SongFilters,
  SongMaterial,
  SongValues,
  UploadMaterialValues,
} from '../types'

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

export function updateSongClassification(id: string, values: SongClassificationValues): Promise<SongClassification> {
  return apiRequest<SongClassification>(`/api/songs/${id}/classification`, { method: 'PUT', body: JSON.stringify(values) })
}

export function createSong(values: SongValues): Promise<Song> {
  return apiRequest<Song>('/api/songs', { method: 'POST', body: JSON.stringify(values) })
}

export function updateSong(id: string, values: SongValues): Promise<Song> {
  return apiRequest<Song>(`/api/songs/${id}`, { method: 'PUT', body: JSON.stringify(values) })
}

// Materials: `/api/music-materials` (Harmonia-BE MusicMaterialsController). The backend sends and expects the
// PascalCase `MaterialType` names; the Web kinds are mapped here and nowhere else.

type ApiMaterialType = 'SheetMusic' | 'Lyrics' | 'SampleAudio' | 'RehearsalMaterial'

const typeByKind: Record<MaterialKind, ApiMaterialType> = {
  sheetMusic: 'SheetMusic',
  lyrics: 'Lyrics',
  sampleAudio: 'SampleAudio',
  rehearsalMaterial: 'RehearsalMaterial',
}

const kindByType = Object.fromEntries(Object.entries(typeByKind).map(([kind, type]) => [type, kind])) as Record<
  ApiMaterialType,
  MaterialKind
>

interface MusicMaterialDto extends Omit<SongMaterial, 'kind' | 'url'> {
  materialType: ApiMaterialType
  fileUrl: string
}

const toMaterial = ({ materialType, fileUrl, ...rest }: MusicMaterialDto): SongMaterial => ({
  ...rest,
  kind: kindByType[materialType],
  url: fileUrl,
})

export async function listMaterials(songId: string): Promise<SongMaterial[]> {
  // ponytail: one page of 100, the backend maximum; a song with more materials would need paging here.
  const page = await apiRequest<PagedList<MusicMaterialDto>>(
    `/api/music-materials${toQuery({ songId, pageNumber: 1, pageSize: 100 })}`,
  )
  return page.items.map(toMaterial)
}

export async function uploadMaterial(songId: string, values: UploadMaterialValues): Promise<SongMaterial> {
  const form = new FormData()
  form.append('songId', songId)
  form.append('title', values.title)
  form.append('materialType', typeByKind[values.kind])
  if (values.targetSkillId) form.append('targetSkillId', values.targetSkillId)
  form.append('file', values.file)
  return toMaterial(await apiRequest<MusicMaterialDto>('/api/music-materials', { method: 'POST', body: form }))
}

/** Deletes a material; FE-54 records deleted materials in the activity history. */
export function deleteMaterial(materialId: string): Promise<void> {
  return apiRequest<void>(`/api/music-materials/${materialId}`, { method: 'DELETE' })
}
