/**
 * DEV FIXTURE – không phải API contract.
 * Decision 0002 option B (approved by Daniel 2026-09-27): UI review without a backend. Loaded only through the
 * dynamic import in `songsApi.ts` when `import.meta.env.DEV && VITE_USE_DEV_FIXTURES=true`.
 * Sample songs; catalog ids match the system-categories fixtures. Uploaded files get a browser object URL so
 * they can be opened during the session; seeded files have no URL.
 */
import dayjs from 'dayjs'
import { nextFixtureId, readFixture, writeFixture } from '@/lib/api/fixtureRuntime.dev'
import type { CatalogRef, MaterialKind, Song, SongDetail, SongMaterial, SongValues } from '../types'

const catalogNames: Record<string, string> = {
  'dev-season-1': 'Mùa Vọng',
  'dev-season-2': 'Mùa Giáng Sinh',
  'dev-season-3': 'Mùa Chay',
  'dev-season-4': 'Mùa Phục Sinh',
  'dev-season-5': 'Mùa Thường Niên',
  'dev-mass-1': 'Lễ Chúa Nhật',
  'dev-mass-2': 'Lễ Trọng',
  'dev-mass-3': 'Lễ Kính',
  'dev-mass-4': 'Lễ Nhớ',
  'dev-mass-5': 'Lễ ngày thường',
  'dev-ceremony-1': 'Chầu Thánh Thể',
  'dev-ceremony-2': 'Rửa Tội',
  'dev-ceremony-3': 'Hôn Phối',
}

const ref = (id?: string): CatalogRef | undefined => (id ? { id, name: catalogNames[id] ?? id } : undefined)
const daysAgo = (days: number) => dayjs().subtract(days, 'day').toISOString()

function material(kind: MaterialKind, fileName: string, days: number): SongMaterial {
  return { id: nextFixtureId('material'), kind, fileName, uploadedAt: daysAgo(days) }
}

let songs: SongDetail[] = [
  {
    id: 'dev-song-1',
    title: 'Con Bước Lên Bàn Thờ',
    season: ref('dev-season-5'),
    massType: ref('dev-mass-1'),
    theme: 'Nhập lễ',
    vocalRequirements: 'Soprano, Alto, Tenor, Bass',
    instrumentRequirements: 'Organ',
    materials: [
      material('sheetMusic', 'con-buoc-len-ban-tho_SATB.pdf', 40),
      material('lyrics', 'loi-con-buoc-len-ban-tho.pdf', 40),
      material('sampleAudio', 'audio-mau-tong-hop.mp3', 37),
    ],
  },
  {
    id: 'dev-song-2',
    title: 'Lễ Vật Tâm Tình',
    season: ref('dev-season-5'),
    massType: ref('dev-mass-1'),
    theme: 'Dâng lễ',
    vocalRequirements: 'Soprano, Alto, Tenor, Bass',
    instrumentRequirements: 'Organ',
    materials: [material('sheetMusic', 'le-vat-tam-tinh.pdf', 30), material('lyrics', 'loi-le-vat-tam-tinh.pdf', 30)],
  },
  {
    id: 'dev-song-3',
    title: 'Linh Hồn Tôi Tán Tụng Chúa',
    season: ref('dev-season-1'),
    massType: ref('dev-mass-2'),
    theme: 'Đức Mẹ',
    vocalRequirements: 'Soprano, Alto',
    instrumentRequirements: 'Organ',
    materials: [material('sheetMusic', 'linh-hon-toi-tan-tung-chua.pdf', 20)],
  },
  {
    id: 'dev-song-4',
    title: 'Đêm Thánh Vô Cùng',
    season: ref('dev-season-2'),
    massType: ref('dev-mass-2'),
    theme: 'Giáng Sinh',
    vocalRequirements: 'Soprano, Alto, Tenor, Bass',
    instrumentRequirements: 'Organ, Piano',
    materials: [
      material('sheetMusic', 'dem-thanh-vo-cung.pdf', 90),
      material('lyrics', 'loi-dem-thanh-vo-cung.pdf', 90),
      material('sampleAudio', 'dem-thanh-vo-cung.mp3', 88),
      material('rehearsalMaterial', 'huong-dan-be-tenor.mp3', 85),
    ],
  },
  {
    id: 'dev-song-5',
    title: 'Hãy Trở Về',
    season: ref('dev-season-3'),
    massType: ref('dev-mass-1'),
    theme: 'Sám hối',
    vocalRequirements: 'Soprano, Alto, Tenor',
    instrumentRequirements: 'Organ',
    materials: [material('lyrics', 'loi-hay-tro-ve.pdf', 60)],
  },
  {
    id: 'dev-song-6',
    title: 'Alleluia Chúa Đã Sống Lại',
    season: ref('dev-season-4'),
    massType: ref('dev-mass-2'),
    theme: 'Ngợi khen',
    vocalRequirements: 'Soprano, Alto, Tenor, Bass',
    instrumentRequirements: 'Organ',
    materials: [material('sheetMusic', 'alleluia-chua-da-song-lai.pdf', 120), material('sampleAudio', 'alleluia.mp3', 118)],
  },
  {
    id: 'dev-song-7',
    title: 'Trầm Hương Đốt',
    season: ref('dev-season-5'),
    ceremonyType: ref('dev-ceremony-1'),
    theme: 'Thánh Thể',
    vocalRequirements: 'Soprano, Alto',
    instrumentRequirements: 'Guitar',
    materials: [material('lyrics', 'loi-tram-huong-dot.pdf', 15)],
  },
  { id: 'dev-song-8', title: 'Xin Vâng', season: ref('dev-season-5'), massType: ref('dev-mass-4'), materials: [] },
]

function summary({ materials, ...song }: SongDetail): Song {
  return { ...song, availableMaterials: [...new Set(materials.map((item) => item.kind))] }
}

function update(id: string, change: (song: SongDetail) => SongDetail): SongDetail {
  const current = songs.find((song) => song.id === id)
  if (!current) throw new Error(`DEV FIXTURE: không tìm thấy bài hát ${id}`)
  const next = change(current)
  songs = songs.map((song) => (song.id === id ? next : song))
  return next
}

export const listSongsFixture = () =>
  readFixture([...songs].sort((a, b) => a.title.localeCompare(b.title, 'vi')).map(summary))

export async function getSongFixture(id: string): Promise<SongDetail | null> {
  const [found] = await readFixture(songs.filter((song) => song.id === id))
  return found ?? null
}

export const saveSongFixture = (id: string | undefined, values: SongValues) =>
  writeFixture(() => {
    const fields = {
      title: values.title,
      season: ref(values.seasonId),
      massType: ref(values.massTypeId),
      ceremonyType: ref(values.ceremonyTypeId),
      theme: values.theme,
      vocalRequirements: values.vocalRequirements,
      instrumentRequirements: values.instrumentRequirements,
    }
    if (id) return summary(update(id, (song) => ({ ...song, ...fields })))
    const song: SongDetail = { id: nextFixtureId('song'), ...fields, materials: [] }
    songs = [...songs, song]
    return summary(song)
  })

export const uploadMaterialFixture = (songId: string, kind: MaterialKind, file: File) =>
  writeFixture(() => {
    const item: SongMaterial = {
      id: nextFixtureId('material'),
      kind,
      fileName: file.name,
      uploadedAt: new Date().toISOString(),
      url: URL.createObjectURL(file),
    }
    update(songId, (song) => ({ ...song, materials: [...song.materials, item] }))
    return item
  })

export async function deleteMaterialFixture(songId: string, materialId: string): Promise<void> {
  await writeFixture(() =>
    update(songId, (song) => ({ ...song, materials: song.materials.filter((item) => item.id !== materialId) })),
  )
}
