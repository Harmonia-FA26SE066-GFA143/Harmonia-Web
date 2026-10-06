/** Material kinds named in Report 1 FE-08 and FE-28 (backend `MaterialType`, mapped in songsApi). */
export type MaterialKind = 'sheetMusic' | 'lyrics' | 'sampleAudio' | 'rehearsalMaterial'

export const materialKinds: MaterialKind[] = ['sheetMusic', 'lyrics', 'sampleAudio', 'rehearsalMaterial']

export const materialKindLabels: Record<MaterialKind, string> = {
  sheetMusic: 'Bản nhạc',
  lyrics: 'Lời bài hát',
  sampleAudio: 'Audio mẫu',
  rehearsalMaterial: 'Tài liệu tập luyện',
}

const documentExtensions = ['.pdf', '.png', '.jpg']
const audioExtensions = ['.mp3', '.m4a', '.wav']

/** Accepted file extensions per kind (Harmonia-BE MusicMaterialService); the backend checks them again. */
export const materialExtensions: Record<MaterialKind, string[]> = {
  sheetMusic: documentExtensions,
  lyrics: documentExtensions,
  sampleAudio: audioExtensions,
  rehearsalMaterial: [...documentExtensions, ...audioExtensions],
}

/** 20 MiB, the backend limit (MusicMaterialService.MaxFileSizeBytes). */
export const maxMaterialBytes = 20 * 1024 * 1024

/** A song of the choir's music library (FE-27), as `SongDto` of GET /api/songs. Missing texts arrive as null. */
export interface Song {
  id: string
  title: string
  composer: string | null
  lyricist: string | null
  musicalKey: string | null
  tempo: string | null
  notes: string | null
}

/** Body of POST /api/songs and PUT /api/songs/{id}. PUT replaces every field, so the form always sends all of them. */
export interface SongValues {
  title: string
  composer?: string
  lyricist?: string
  musicalKey?: string
  tempo?: string
  notes?: string
}

/** A lookup entry a song is classified under (season, Mass type, ceremony type, theme). */
export interface NamedRef {
  id: string
  name: string
}

export interface SkillRequirement {
  skillId: string
  skillName: string
  isMandatory: boolean
}

/** GET /api/songs/{id}/classification: the FE-29 dimensions, each with any number of values. */
export interface SongClassification {
  liturgicalSeasons: NamedRef[]
  massTypes: NamedRef[]
  ceremonyTypes: NamedRef[]
  songThemes: NamedRef[]
  vocalRequirements: SkillRequirement[]
  instrumentRequirements: SkillRequirement[]
}

export interface SkillRequirementValue {
  skillId: string
  isMandatory: boolean
}

/** Body of PUT /api/songs/{id}/classification: the full desired set; anything left out is removed from the song. */
export interface SongClassificationValues {
  liturgicalSeasonIds: string[]
  massTypeIds: string[]
  ceremonyTypeIds: string[]
  songThemeIds: string[]
  vocalRequirements: SkillRequirementValue[]
  instrumentRequirements: SkillRequirementValue[]
}

/** A material of a song, as `MusicMaterialDto` of GET /api/music-materials. */
export interface SongMaterial {
  id: string
  kind: MaterialKind
  title: string
  /** Original name, for display only. */
  fileName: string
  fileSizeBytes: number | null
  targetSkillId: string | null
  targetSkillName: string | null
  /** Short-lived signed URL: never stored, the list is fetched again instead. */
  url: string
  /** Backend `DateTime`; read it with `parseUtc`. */
  createdAt: string
}

/** Form fields of the multipart upload; the song comes from the page. */
export interface UploadMaterialValues {
  kind: MaterialKind
  title: string
  targetSkillId?: string
  file: File
}

/** Search and classification filters of GET /api/songs; they combine with AND on the server. */
export interface SongFilters {
  /** Matches title, composer and lyricist. */
  search: string
  seasonId?: string
  massTypeId?: string
  ceremonyTypeId?: string
  themeId?: string
  /** Matches a vocal or an instrument requirement. */
  skillId?: string
}
