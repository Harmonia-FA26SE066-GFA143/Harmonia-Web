/**
 * DEV FIXTURE – không phải API contract.
 * Decision 0002 option B (approved by Daniel 2026-09-27): UI review without a backend. Loaded only through the
 * dynamic import in `programsApi.ts` when `import.meta.env.DEV && VITE_USE_DEV_FIXTURES=true`.
 * Fictional programs dated around today so the calendar and "upcoming" views have data. Catalog ids match the
 * system-categories fixtures; program ids match the report fixtures. Song-list statuses are the conceptual
 * labels from song-approval.md (INTERPRETATION).
 */
import dayjs from 'dayjs'
import { nextFixtureId, readFixture, writeFixture } from '@/lib/api/fixtureRuntime.dev'
import type { CatalogRef, LiturgicalProgram, LiturgicalProgramDetail, ProgramFormValues, ProgramSong } from '../types'

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

const sundaySongs: ProgramSong[] = [
  { id: 's1', liturgicalPart: 'Ca nhập lễ', title: 'Con Bước Lên Bàn Thờ' },
  { id: 's2', liturgicalPart: 'Đáp ca', title: 'Thánh vịnh 18B' },
  { id: 's3', liturgicalPart: 'Ca dâng lễ', title: 'Lễ Vật Tâm Tình' },
  { id: 's4', liturgicalPart: 'Ca hiệp lễ', title: 'Linh Hồn Tôi Tán Tụng Chúa' },
]

let programs: LiturgicalProgramDetail[] = [
  {
    id: 'dev-program-1',
    eventName: 'Lễ Chúa Nhật Thường Niên',
    date: day(-3),
    season: ref('dev-season-5'),
    massType: ref('dev-mass-1'),
    songListStatus: 'approved',
    songs: sundaySongs,
  },
  {
    id: 'dev-program-2',
    eventName: 'Giờ Chầu Thánh Thể đầu tháng',
    date: day(-6),
    season: ref('dev-season-5'),
    ceremonyType: ref('dev-ceremony-1'),
    songListStatus: 'approved',
    songs: [{ id: 's5', liturgicalPart: 'Chầu Thánh Thể', title: 'Trầm Hương Đốt' }],
  },
  {
    id: 'dev-program-3',
    eventName: 'Lễ Chúa Nhật tuần tới',
    date: day(4),
    season: ref('dev-season-5'),
    massType: ref('dev-mass-1'),
    specialRequirements: 'Ưu tiên bài hát phù hợp chủ đề Lời Chúa của ngày lễ.',
    songListStatus: 'submitted',
    songs: sundaySongs,
  },
  {
    id: 'dev-program-4',
    eventName: 'Lễ Bổn mạng Giáo xứ',
    date: day(11),
    season: ref('dev-season-5'),
    massType: ref('dev-mass-2'),
    specialRequirements: 'Có rước kiệu sau Thánh lễ.',
    songListStatus: 'revisionRequested',
    songs: sundaySongs.slice(0, 2),
  },
  {
    id: 'dev-program-5',
    eventName: 'Thánh lễ Hôn Phối',
    date: day(16),
    season: ref('dev-season-5'),
    ceremonyType: ref('dev-ceremony-3'),
    songs: [],
  },
]

const summary = ({ songs: _songs, ...program }: LiturgicalProgramDetail): LiturgicalProgram => program

export const listProgramsFixture = () =>
  readFixture([...programs].sort((a, b) => a.date.localeCompare(b.date)).map(summary))

export async function getProgramFixture(id: string): Promise<LiturgicalProgramDetail | null> {
  const [found] = await readFixture(programs.filter((program) => program.id === id))
  return found ?? null
}

export const createProgramFixture = (values: ProgramFormValues) =>
  writeFixture(() => {
    const program: LiturgicalProgramDetail = {
      id: nextFixtureId('program'),
      eventName: values.eventName,
      date: values.date,
      season: ref(values.seasonId),
      massType: ref(values.massTypeId),
      ceremonyType: ref(values.ceremonyTypeId),
      specialRequirements: values.specialRequirements,
      songs: [],
    }
    programs = [...programs, program]
    return summary(program)
  })
