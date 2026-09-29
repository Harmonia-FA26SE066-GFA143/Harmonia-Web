/**
 * DEV FIXTURE – không phải API contract.
 * Decision 0002 option B (approved by Daniel 2026-09-27): UI review without a backend. Loaded only through the
 * dynamic import in `rehearsalsApi.ts` when `import.meta.env.DEV && VITE_USE_DEV_FIXTURES=true`.
 * Program ids match the liturgical-programs fixtures and song ids the song-lists fixtures; times are relative to
 * today so the upcoming and past views both have data. The attendance fixture reads these ids.
 */
import dayjs from 'dayjs'
import { nextFixtureId, readFixture, writeFixture } from '@/lib/api/fixtureRuntime.dev'
import type { Rehearsal, RehearsalValues } from '../types'

const at = (dayOffset: number, hour: number, minute = 0) =>
  dayjs().add(dayOffset, 'day').hour(hour).minute(minute).second(0).millisecond(0).toISOString()

let rehearsals: Rehearsal[] = [
  {
    id: 'dev-rehearsal-1',
    programId: 'dev-program-1',
    name: 'Tập toàn ca đoàn',
    startAt: at(-5, 19, 30),
    endAt: at(-5, 21),
    location: 'Phòng tập nhà xứ',
    songs: [
      { songId: 'dev-song-1', title: 'Con Bước Lên Bàn Thờ' },
      { songId: 'dev-song-2', title: 'Lễ Vật Tâm Tình' },
    ],
  },
  {
    id: 'dev-rehearsal-2',
    programId: 'dev-program-3',
    name: 'Tập riêng bè Nam (Tenor & Bass)',
    startAt: at(-1, 20),
    endAt: at(-1, 21, 15),
    location: 'Phòng sinh hoạt phụng vụ',
    songs: [{ songId: 'dev-song-2', title: 'Lễ Vật Tâm Tình' }],
    note: 'Luyện bè 2 và bè trầm bài dâng lễ.',
  },
  {
    id: 'dev-rehearsal-3',
    programId: 'dev-program-3',
    name: 'Tập chính ráp 4 bè',
    startAt: at(2, 19, 30),
    endAt: at(2, 21),
    location: 'Phòng tập nhà xứ',
    songs: [
      { songId: 'dev-song-1', title: 'Con Bước Lên Bàn Thờ' },
      { songId: 'dev-song-2', title: 'Lễ Vật Tâm Tình' },
      { songId: 'dev-song-3', title: 'Linh Hồn Tôi Tán Tụng Chúa' },
    ],
  },
  {
    id: 'dev-rehearsal-4',
    programId: 'dev-program-4',
    name: 'Chuẩn bị phục vụ Lễ Bổn mạng',
    startAt: at(9, 18),
    endAt: at(9, 20),
    location: 'Nhà thờ',
    songs: [{ songId: 'dev-song-1', title: 'Con Bước Lên Bàn Thờ' }],
  },
]

const byStart = (a: Rehearsal, b: Rehearsal) => a.startAt.localeCompare(b.startAt)

export const listRehearsalsFixture = () => readFixture([...rehearsals].sort(byStart))

export const saveRehearsalFixture = ({ id, values }: { id?: string; values: RehearsalValues }) =>
  writeFixture(() => {
    const saved: Rehearsal = { id: id ?? nextFixtureId('rehearsal'), ...values }
    rehearsals = id ? rehearsals.map((item) => (item.id === id ? saved : item)) : [...rehearsals, saved]
    return saved
  })

export const deleteRehearsalFixture = (id: string) =>
  writeFixture(() => {
    rehearsals = rehearsals.filter((item) => item.id !== id)
    return {}
  }).then(() => undefined)
