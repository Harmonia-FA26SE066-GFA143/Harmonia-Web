import type { CatalogItem } from '@/features/system-categories'

/** Reference to an FE-50 catalog entry (liturgical season, Mass type, ceremony type). */
export type CatalogRef = Pick<CatalogItem, 'id' | 'name'>

/** Material kinds named in Report 1 FE-08 and FE-28. File formats and size limits are TBD. */
export type MaterialKind = 'sheetMusic' | 'lyrics' | 'sampleAudio' | 'rehearsalMaterial'

export const materialKinds: MaterialKind[] = ['sheetMusic', 'lyrics', 'sampleAudio', 'rehearsalMaterial']

export const materialKindLabels: Record<MaterialKind, string> = {
  sheetMusic: 'Bản nhạc',
  lyrics: 'Lời bài hát',
  sampleAudio: 'Audio mẫu',
  rehearsalMaterial: 'Tài liệu tập luyện',
}

/**
 * The six FE-29 classification dimensions. Season, Mass type and ceremony type reuse the FE-50 catalogs
 * (interpretation: the dimensions share their names). Theme, vocal and instrument requirements are free text:
 * their vocabularies, requiredness and cardinality are UNRESOLVED (domain.md), so one value each is assumed.
 */
export interface SongClassification {
  season?: CatalogRef
  massType?: CatalogRef
  ceremonyType?: CatalogRef
  theme?: string
  vocalRequirements?: string
  instrumentRequirements?: string
}

/**
 * A song of the choir's music library (FE-27). No status, author or usage count: Report 1 defines none.
 * Not yet mapped to the backend SongDto: rework these types from the DTOs when the music library is wired.
 */
export interface Song extends SongClassification {
  id: string
  title: string
  /** Material kinds that have at least one file, for the library overview. */
  availableMaterials: MaterialKind[]
}

export interface SongMaterial {
  id: string
  kind: MaterialKind
  fileName: string
  /** ISO 8601 timestamp. */
  uploadedAt: string
  /** Where the file can be viewed or downloaded. TBD: how files are served comes with the contract. */
  url?: string
}

export interface SongDetail extends SongClassification {
  id: string
  title: string
  materials: SongMaterial[]
}

/** Values of the add/edit form. No field except the title is required (FE-29 requiredness UNRESOLVED). */
export interface SongValues {
  title: string
  seasonId?: string
  massTypeId?: string
  ceremonyTypeId?: string
  theme?: string
  vocalRequirements?: string
  instrumentRequirements?: string
}

export interface SongFilters {
  search: string
  seasonId?: string
  massTypeId?: string
  ceremonyTypeId?: string
  theme?: string
  vocalRequirements?: string
  instrumentRequirements?: string
}
