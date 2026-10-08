/**
 * DEV FIXTURE – không phải API contract.
 * Decision 0002 option B (approved by Daniel 2026-09-27): UI review without a backend. Loaded only through the
 * dynamic import in `programsApi.ts` when `import.meta.env.DEV && VITE_USE_DEV_FIXTURES=true`.
 * Fictional programs dated around today so the calendar and "upcoming" views have data. Catalog entries are
 * samples, not backend lookups; program ids match the report and song-list fixtures. The song-list status and
 * songs come from the song-lists fixture so every page shows the same state.
 */
import dayjs from 'dayjs'
import { readFixture } from '@/lib/api/fixtureRuntime.dev'
import { songListSnapshot } from '@/features/song-lists/api/fixtures.dev'
import type { CatalogRef, LiturgicalProgram, LiturgicalProgramDetail } from '../types'

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
const day = (offset: number) => dayjs().add(offset, 'day').format('YYYY-MM-DD')

type ProgramRecord = Omit<LiturgicalProgram, 'songListStatus'>

let programs: ProgramRecord[] = [
  { id: 'dev-program-1', eventName: 'Lễ Chúa Nhật Thường Niên', date: day(-3), season: ref('dev-season-5'), massType: ref('dev-mass-1') },
  {
    id: 'dev-program-2',
    eventName: 'Giờ Chầu Thánh Thể đầu tháng',
    date: day(-6),
    season: ref('dev-season-5'),
    ceremonyType: ref('dev-ceremony-1'),
  },
  {
    id: 'dev-program-3',
    eventName: 'Lễ Chúa Nhật tuần tới',
    date: day(4),
    season: ref('dev-season-5'),
    massType: ref('dev-mass-1'),
    specialRequirements: 'Ưu tiên bài hát phù hợp chủ đề Lời Chúa của ngày lễ.',
  },
  {
    id: 'dev-program-4',
    eventName: 'Lễ Bổn mạng Giáo xứ',
    date: day(11),
    season: ref('dev-season-5'),
    massType: ref('dev-mass-2'),
    specialRequirements: 'Có rước kiệu sau Thánh lễ.',
  },
  { id: 'dev-program-5', eventName: 'Thánh lễ Hôn Phối', date: day(16), season: ref('dev-season-5'), ceremonyType: ref('dev-ceremony-3') },
]

function withSongList(program: ProgramRecord): LiturgicalProgramDetail {
  const list = songListSnapshot(program.id)
  return {
    ...program,
    songListStatus: list.status,
    songs: list.items.map(({ id, liturgicalPart, title }) => ({ id, liturgicalPart, title })),
  }
}

const summary = (program: ProgramRecord): LiturgicalProgram => {
  const { songs: _songs, ...rest } = withSongList(program)
  return rest
}

export const listProgramsFixture = () => readFixture([...programs].sort((a, b) => a.date.localeCompare(b.date)).map(summary))

export async function getProgramFixture(id: string): Promise<LiturgicalProgramDetail | null> {
  const [found] = await readFixture(programs.filter((program) => program.id === id).map(withSongList))
  return found ?? null
}

