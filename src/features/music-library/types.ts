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
// The backend renders MIDI for the mobile piano roll; browsers cannot play it, so the Web only offers the download.
const midiExtensions = ['.mid', '.midi']

/**
 * Accepted file extensions per kind (Harmonia-BE MusicMaterialService, BE d394db4); the backend checks them again.
 * Lyrics are a Word file or typed text; pdf/png/jpg lyrics uploaded earlier stay readable but cannot be uploaded.
 */
export const materialExtensions: Record<MaterialKind, string[]> = {
  sheetMusic: documentExtensions,
  lyrics: ['.docx'],
  sampleAudio: [...audioExtensions, ...midiExtensions],
  rehearsalMaterial: [...documentExtensions, ...audioExtensions, ...midiExtensions],
}

/** 20 MiB, the backend limit (MusicMaterialService.MaxFileSizeBytes). */
export const maxMaterialBytes = 20 * 1024 * 1024

/** UploadMusicMaterialRequestValidator.MaxLyricsTextLength. */
export const maxLyricsTextLength = 20_000

export const fileExtension = (fileName: string) => fileName.slice(fileName.lastIndexOf('.')).toLowerCase()

export const isMidiFile = (fileName: string | null) => fileName !== null && midiExtensions.includes(fileExtension(fileName))

/** Audio the browser plays; a MIDI file is downloaded instead. */
export const isPlayableAudio = ({ fileName }: Pick<SongMaterial, 'fileName'>) =>
  fileName !== null && audioExtensions.includes(fileExtension(fileName))

/** `PlaybackInstrument` of Harmonia-BE: what the mobile app plays a MIDI file with. */
export type PlaybackInstrument = 'piano' | 'organ' | 'guitar' | 'stringEnsemble'

export const playbackInstrumentLabels: Record<PlaybackInstrument, string> = {
  piano: 'Piano',
  organ: 'Đàn organ',
  guitar: 'Guitar',
  stringEnsemble: 'Dàn dây',
}

/** A song of the choir's music library (FE-27), as `SongDto` of GET /api/songs. Missing texts arrive as null. */
export interface Song {
  id: string
  title: string
  composer: string | null
  lyricist: string | null
  musicalKey: string | null
  tempo: string | null
  notes: string | null
  /** Active materials per kind (0 when none); absent on a song the Web just saved. */
  materialCounts?: Record<MaterialKind, number>
  /** Has a season, Mass type, ceremony type, theme or liturgical slot. */
  isClassified?: boolean
  /** Past published programs whose approved list has the song, as the song-usage report counts them. */
  timesUsed?: number
  /** YYYY-MM-DD of the latest of those programs. */
  lastUsedDate?: string
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

/** A lookup entry a song is classified under (season, Mass type, ceremony type, theme, liturgical slot). */
export interface NamedRef {
  id: string
  name: string
}

export interface SkillRequirement {
  skillId: string
  skillName: string
  isMandatory: boolean
  /** People needed, 1–50 (BE d1ca63e); 1 when the song does not say. */
  requiredCount: number
}

/** GET /api/songs/{id}/classification: the FE-29 dimensions, each with any number of values. */
export interface SongClassification {
  liturgicalSeasons: NamedRef[]
  massTypes: NamedRef[]
  ceremonyTypes: NamedRef[]
  songThemes: NamedRef[]
  /** Where in the Mass the song fits (Nhập lễ, Đáp ca…); the song suggestions match on it. */
  liturgicalSlots: NamedRef[]
  vocalRequirements: SkillRequirement[]
  instrumentRequirements: SkillRequirement[]
}

export interface SkillRequirementValue {
  skillId: string
  isMandatory: boolean
  requiredCount: number
}

/** Body of PUT /api/songs/{id}/classification: the full desired set; anything left out is removed from the song. */
export interface SongClassificationValues {
  liturgicalSeasonIds: string[]
  massTypeIds: string[]
  ceremonyTypeIds: string[]
  songThemeIds: string[]
  liturgicalSlotIds: string[]
  vocalRequirements: SkillRequirementValue[]
  instrumentRequirements: SkillRequirementValue[]
}

/** A material of a song, as `MusicMaterialDto` of GET /api/music-materials. */
export interface SongMaterial {
  id: string
  kind: MaterialKind
  title: string
  /** Original name, for display only; null for typed lyrics. */
  fileName: string | null
  fileSizeBytes: number | null
  targetSkillId: string | null
  targetSkillName: string | null
  /** Short-lived signed URL: never stored, the list is fetched again instead. Null for typed lyrics. */
  url: string | null
  /** Lyrics typed as text; null for every material with a file. */
  lyricsText: string | null
  /** Backend `DateTime`; read it with `parseUtc`. */
  createdAt: string
}

/** Form fields of the multipart upload; the song comes from the page. Lyrics send a file or the text, never both. */
export interface UploadMaterialValues {
  kind: MaterialKind
  title: string
  targetSkillId?: string
  file?: File
  lyricsText?: string
  /** MIDI files only; the backend renders with piano when it is left out. */
  instrument?: PlaybackInstrument
}

/** Search and classification filters of GET /api/songs; they combine with AND on the server. */
export interface SongFilters {
  /** Matches title, composer and lyricist. */
  search: string
  seasonId?: string
  massTypeId?: string
  ceremonyTypeId?: string
  /** Also finds the songs of its sub-themes. */
  themeId?: string
  slotId?: string
  /** Matches a vocal or an instrument requirement. */
  skillId?: string
  /** 'no': songs with no season, Mass type, ceremony type, theme or slot yet. */
  classified?: 'yes' | 'no'
  /** Songs with no active material of this kind. */
  missingMaterial?: MaterialKind
}

/** Body of PUT /api/music-materials/{id}: the file and the kind stay as uploaded. */
export interface MaterialValues {
  title: string
  /** Absent: the material is for the whole choir. */
  targetSkillId?: string
  /** Required for typed lyrics, which have no file to replace; absent for every other material. */
  lyricsText?: string
}

/** `LearningStatus` of Harmonia-BE; the wording follows the mobile app. NotStarted: the member never marked it. */
export type LearningStatus = 'notStarted' | 'needsPractice' | 'learned'

export const learningStatuses: LearningStatus[] = ['notStarted', 'needsPractice', 'learned']

export const learningStatusLabels: Record<LearningStatus, string> = {
  notStarted: 'Chưa học',
  needsPractice: 'Cần tập thêm',
  learned: 'Đã thuộc',
}

/**
 * One member expected to learn a material (FE-09), as `MaterialLearningProgressDetailDto`: every active member, or
 * only those with the target skill approved.
 */
export interface LearningProgress {
  memberId: string
  fullName: string
  status: LearningStatus
  /** Backend `DateTime`, absent while NotStarted; read it with `parseUtc`. */
  updatedAt: string | null
}
