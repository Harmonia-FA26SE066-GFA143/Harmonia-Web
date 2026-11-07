import { apiRequest, orNullOn404 } from '@/lib/api/client'
import { toQuery, type PagedList } from '@/lib/api/paging'
import type {
  LearningProgress,
  LearningStatus,
  MaterialPlayback,
  MaterialPlaybackBundle,
  MaterialKind,
  MaterialValues,
  MidiPlaybackNotes,
  PlaybackInstrument,
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

interface SongDto extends Omit<Song, 'materialCounts' | 'lastUsedDate'> {
  materialCounts?: Partial<Record<ApiMaterialType, number>>
  lastUsedDate?: string | null
}

const toSong = ({ materialCounts, lastUsedDate, ...rest }: SongDto): Song => ({
  ...rest,
  materialCounts: materialCounts && {
    sheetMusic: materialCounts.SheetMusic ?? 0,
    lyrics: materialCounts.Lyrics ?? 0,
    sampleAudio: materialCounts.SampleAudio ?? 0,
    rehearsalMaterial: materialCounts.RehearsalMaterial ?? 0,
    interactiveScore: materialCounts.InteractiveScore ?? 0,
  },
  lastUsedDate: lastUsedDate ?? undefined,
})

/** Keyword and names are matched ignoring case and Vietnamese diacritics on the server. */
export async function listSongs(filters: SongFilters, page: SongPage): Promise<PagedList<Song>> {
  const result = await apiRequest<PagedList<SongDto>>(
    `/api/songs${toQuery({
      keyword: filters.search.trim(),
      liturgicalSeasonId: filters.seasonId,
      massTypeId: filters.massTypeId,
      ceremonyTypeId: filters.ceremonyTypeId,
      songThemeId: filters.themeId,
      liturgicalSlotId: filters.slotId,
      skillId: filters.skillId,
      isClassified: filters.classified === undefined ? undefined : filters.classified === 'yes',
      missingMaterialType: filters.missingMaterial && typeByKind[filters.missingMaterial],
      ...page,
    })}`,
  )
  return { ...result, items: result.items.map(toSong) }
}

export async function getSong(id: string): Promise<Song | null> {
  const song = await orNullOn404(apiRequest<SongDto>(`/api/songs/${id}`))
  return song && toSong(song)
}

export function getSongClassification(id: string): Promise<SongClassification | null> {
  return orNullOn404(apiRequest<SongClassification>(`/api/songs/${id}/classification`))
}

export function updateSongClassification(id: string, values: SongClassificationValues): Promise<SongClassification> {
  return apiRequest<SongClassification>(`/api/songs/${id}/classification`, { method: 'PUT', body: JSON.stringify(values) })
}

export async function createSong(values: SongValues): Promise<Song> {
  return toSong(await apiRequest<SongDto>('/api/songs', { method: 'POST', body: JSON.stringify(values) }))
}

export async function updateSong(id: string, values: SongValues): Promise<Song> {
  return toSong(await apiRequest<SongDto>(`/api/songs/${id}`, { method: 'PUT', body: JSON.stringify(values) }))
}

// Materials: `/api/music-materials` (Harmonia-BE MusicMaterialsController). The backend sends and expects the
// PascalCase `MaterialType` names; the Web kinds are mapped here and nowhere else.

type ApiMaterialType = 'SheetMusic' | 'Lyrics' | 'SampleAudio' | 'RehearsalMaterial' | 'InteractiveScore'

const typeByKind: Record<MaterialKind, ApiMaterialType> = {
  sheetMusic: 'SheetMusic',
  lyrics: 'Lyrics',
  sampleAudio: 'SampleAudio',
  rehearsalMaterial: 'RehearsalMaterial',
  interactiveScore: 'InteractiveScore',
}

const kindByType = Object.fromEntries(Object.entries(typeByKind).map(([kind, type]) => [type, kind])) as Record<
  ApiMaterialType,
  MaterialKind
>

interface MusicMaterialDto extends Omit<SongMaterial, 'kind' | 'url'> {
  materialType: ApiMaterialType
  fileUrl: string | null
}

const apiInstrument: Record<PlaybackInstrument, string> = {
  piano: 'Piano',
  organ: 'Organ',
  guitar: 'Guitar',
  stringEnsemble: 'StringEnsemble',
}

const toMaterial = ({ materialType, fileUrl, ...rest }: MusicMaterialDto): SongMaterial => ({
  ...rest,
  kind: kindByType[materialType],
  url: fileUrl,
})

interface PlaybackDto extends Omit<MaterialPlayback, 'status' | 'instrument'> {
  status: 'Ready'
  instrument: 'Piano' | 'Organ' | 'Guitar' | 'StringEnsemble'
}

const playbackInstrumentByApi: Record<PlaybackDto['instrument'], PlaybackInstrument> = {
  Piano: 'piano',
  Organ: 'organ',
  Guitar: 'guitar',
  StringEnsemble: 'stringEnsemble',
}

/** WAV and note data rendered together from a MIDI file, so both share one timeline. */
export async function getMaterialPlayback(materialId: string): Promise<MaterialPlaybackBundle> {
  const dto = await apiRequest<PlaybackDto>(`/api/music-materials/${materialId}/playback`)
  const playback: MaterialPlayback = {
    ...dto,
    status: 'ready',
    instrument: playbackInstrumentByApi[dto.instrument],
  }
  // This is a private storage URL signed by the backend. Keep the fetch in the API module, not in presentation code.
  const response = await fetch(playback.notesUrl)
  if (!response.ok) throw new Error(`Playback notes request failed with status ${response.status}`)
  const notes = (await response.json()) as MidiPlaybackNotes
  return { playback, notes }
}

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
  if (values.file) form.append('file', values.file)
  if (values.lyricsText) form.append('lyricsText', values.lyricsText)
  if (values.instrument) form.append('instrument', apiInstrument[values.instrument])
  return toMaterial(await apiRequest<MusicMaterialDto>('/api/music-materials', { method: 'POST', body: form }))
}

/** Draft lyrics read by AI from a sheet music file (Choir Director); nothing is saved until it is uploaded as lyrics. */
export async function extractLyrics(materialId: string): Promise<string> {
  const { lyricsText } = await apiRequest<{ lyricsText: string }>(`/api/music-materials/${materialId}/extract-lyrics`, {
    method: 'POST',
  })
  return lyricsText
}

/** Deletes a material; FE-54 records deleted materials in the activity history. */
export function deleteMaterial(materialId: string): Promise<void> {
  return apiRequest<void>(`/api/music-materials/${materialId}`, { method: 'DELETE' })
}

/**
 * Replaces the file of a material (`PUT /api/music-materials/{id}/file`), keeping its id, title, kind, target skill
 * and the assignments it is attached to. Members keep what they marked unless `resetProgress` clears it.
 */
export async function replaceMaterialFile(
  materialId: string,
  file: File,
  resetProgress: boolean,
  instrument?: PlaybackInstrument,
): Promise<SongMaterial> {
  const form = new FormData()
  form.append('file', file)
  form.append('resetProgress', String(resetProgress))
  if (instrument) form.append('instrument', apiInstrument[instrument])
  return toMaterial(await apiRequest<MusicMaterialDto>(`/api/music-materials/${materialId}/file`, { method: 'PUT', body: form }))
}

/** Replaces title, target skill and typed lyrics; leaving the skill out makes the material for the whole choir. */
export async function updateMaterial(materialId: string, values: MaterialValues): Promise<void> {
  await apiRequest<unknown>(`/api/music-materials/${materialId}`, { method: 'PUT', body: JSON.stringify(values) })
}

/**
 * Removes the song from the library (Harmonia-BE SongService.DeleteAsync sets `IsActive = false`): it is no longer
 * listed or opened. A song in any song list, rehearsal or practice assignment cannot be deleted (409 SONG_IN_USE).
 */
export function deleteSong(id: string): Promise<void> {
  return apiRequest<void>(`/api/songs/${id}`, { method: 'DELETE' })
}

type ApiLearningStatus = 'NotStarted' | 'NeedsPractice' | 'Learned'

const learningByApi: Record<ApiLearningStatus, LearningStatus> = {
  NotStarted: 'notStarted',
  NeedsPractice: 'needsPractice',
  Learned: 'learned',
}

const apiLearning = Object.fromEntries(Object.entries(learningByApi).map(([api, status]) => [status, api])) as Record<
  LearningStatus,
  ApiLearningStatus
>

interface LearningProgressDto extends Omit<LearningProgress, 'status'> {
  status: ApiLearningStatus
}

/** Members expected to learn a material, by name, optionally only those with one status (FE-09). */
export async function listLearningProgress(
  materialId: string,
  status: LearningStatus | undefined,
  page: SongPage,
): Promise<PagedList<LearningProgress>> {
  const result = await apiRequest<PagedList<LearningProgressDto>>(
    `/api/music-materials/${materialId}/learning-progress${toQuery({ status: status && apiLearning[status], ...page })}`,
  )
  return { ...result, items: result.items.map((item) => ({ ...item, status: learningByApi[item.status] })) }
}
