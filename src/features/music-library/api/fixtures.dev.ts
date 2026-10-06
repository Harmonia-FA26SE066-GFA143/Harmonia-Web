/**
 * DEV FIXTURE – không phải API contract.
 * Decision 0002 option B (approved by Daniel 2026-09-27): UI review without a backend. Loaded only through the
 * dynamic import in `songsApi.ts` when `import.meta.env.DEV && VITE_USE_DEV_FIXTURES=true`.
 * Materials only (songs come from the API): kept per song id for the session, starting empty. Uploaded files get a
 * browser object URL so they can be opened. Removed when materials are wired (issue #41).
 */
import { nextFixtureId, readFixture, writeFixture } from '@/lib/api/fixtureRuntime.dev'
import type { MaterialKind, SongMaterial } from '../types'

const materialsBySong = new Map<string, SongMaterial[]>()

export const listMaterialsFixture = (songId: string) => readFixture(materialsBySong.get(songId) ?? [])

export const uploadMaterialFixture = (songId: string, kind: MaterialKind, file: File) =>
  writeFixture(() => {
    const item: SongMaterial = {
      id: nextFixtureId('material'),
      kind,
      fileName: file.name,
      uploadedAt: new Date().toISOString(),
      url: URL.createObjectURL(file),
    }
    materialsBySong.set(songId, [...(materialsBySong.get(songId) ?? []), item])
    return item
  })

export async function deleteMaterialFixture(songId: string, materialId: string): Promise<void> {
  await writeFixture(() =>
    materialsBySong.set(songId, (materialsBySong.get(songId) ?? []).filter((item) => item.id !== materialId)),
  )
}
