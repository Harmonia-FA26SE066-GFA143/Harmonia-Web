import { env } from '@/config/env'
import { ApiContractMissingError } from '@/lib/api/errors'
import type { MaterialKind, Song, SongDetail, SongMaterial, SongValues } from '../types'

// Backend contract exists, not wired yet: `/api/songs` (paged list, get, create, update, delete,
// GET/PUT {id}/classification) and `/api/music-materials` (multipart upload, list, update, delete). Not wired
// because the Web types differ from the DTOs (paging, multi-value classification, composer, material title and
// target skill, PascalCase enums) and apiRequest cannot send FormData yet (audit W4–W6). Until then each function
// checks `import.meta.env.DEV` at the call site so the fixture import is dropped from dist/.

export async function listSongs(): Promise<Song[]> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { listSongsFixture } = await import('./fixtures.dev')
    return listSongsFixture()
  }
  throw new ApiContractMissingError('Xem kho bài hát')
}

/** One song with its materials, or `null` when it does not exist (how the backend reports this is TBD). */
export async function getSong(id: string): Promise<SongDetail | null> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { getSongFixture } = await import('./fixtures.dev')
    return getSongFixture(id)
  }
  throw new ApiContractMissingError('Xem chi tiết bài hát')
}

export async function createSong(values: SongValues): Promise<Song> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { saveSongFixture } = await import('./fixtures.dev')
    return saveSongFixture(undefined, values)
  }
  throw new ApiContractMissingError('Thêm bài hát')
}

export async function updateSong(id: string, values: SongValues): Promise<Song> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { saveSongFixture } = await import('./fixtures.dev')
    return saveSongFixture(id, values)
  }
  throw new ApiContractMissingError('Chỉnh sửa bài hát')
}

/** Uploads one material file. Accepted formats and size limits are TBD, so none are enforced here. */
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
