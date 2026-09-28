/**
 * DEV FIXTURE – không phải API contract.
 * Decision 0002 option B (approved by Daniel 2026-09-27): UI review without a backend. Loaded only through the
 * dynamic import in `songListsApi.ts` when `import.meta.env.DEV && VITE_USE_DEV_FIXTURES=true`.
 * Song lists keyed by the liturgical-programs fixture ids; song ids match the music-library fixtures. The
 * liturgical-programs fixture reads `songListSnapshot` so program pages show the same status and songs.
 * Status transitions mirror the owner decision of 2026-09-28; the real backend is authoritative.
 */
import dayjs from 'dayjs'
import { nextFixtureId, readFixture, writeFixture } from '@/lib/api/fixtureRuntime.dev'
import type { SongList, SongListItem, SongListItemInput, SongReview } from '../types'

const item = (songId: string, title: string, liturgicalPart: string, extra: Partial<SongListItem> = {}): SongListItem => ({
  id: nextFixtureId('list-item'),
  songId,
  title,
  liturgicalPart,
  ...extra,
})

const sunday = () => [
  item('dev-song-1', 'Con Bước Lên Bàn Thờ', 'Ca nhập lễ', { directorNote: 'Toàn ca đoàn hát, nhịp hoan ca.' }),
  item('dev-song-2', 'Lễ Vật Tâm Tình', 'Ca dâng lễ'),
  item('dev-song-3', 'Linh Hồn Tôi Tán Tụng Chúa', 'Ca hiệp lễ'),
]

const lists = new Map<string, SongList>([
  [
    'dev-program-1',
    {
      programId: 'dev-program-1',
      status: 'approved',
      items: sunday().map((entry) => ({ ...entry, review: { decision: 'accepted' } })),
      submittedAt: dayjs().subtract(8, 'day').toISOString(),
      reviewedAt: dayjs().subtract(7, 'day').toISOString(),
    },
  ],
  [
    'dev-program-2',
    {
      programId: 'dev-program-2',
      status: 'approved',
      items: [item('dev-song-7', 'Trầm Hương Đốt', 'Chầu Thánh Thể', { review: { decision: 'accepted' } })],
      submittedAt: dayjs().subtract(10, 'day').toISOString(),
      reviewedAt: dayjs().subtract(9, 'day').toISOString(),
    },
  ],
  [
    'dev-program-3',
    { programId: 'dev-program-3', status: 'submitted', items: sunday(), submittedAt: dayjs().subtract(1, 'day').toISOString() },
  ],
  [
    'dev-program-4',
    {
      programId: 'dev-program-4',
      status: 'revisionRequested',
      items: [
        item('dev-song-1', 'Con Bước Lên Bàn Thờ', 'Ca nhập lễ', { review: { decision: 'accepted' } }),
        item('dev-song-5', 'Hãy Trở Về', 'Ca dâng lễ', {
          review: { decision: 'revisionRequested', note: 'Bài này hợp Mùa Chay hơn; xin chọn bài dâng lễ mừng Bổn mạng.' },
        }),
      ],
      submittedAt: dayjs().subtract(3, 'day').toISOString(),
      reviewedAt: dayjs().subtract(2, 'day').toISOString(),
      priestNote: 'Nhìn chung phù hợp, chỉ cần đổi bài dâng lễ.',
    },
  ],
])

const empty = (programId: string): SongList => ({ programId, items: [] })

/** Current list of a program, for the liturgical-programs fixture (dev only). */
export const songListSnapshot = (programId: string): SongList => lists.get(programId) ?? empty(programId)

export async function getSongListFixture(programId: string): Promise<SongList> {
  const [list] = await readFixture([songListSnapshot(programId)])
  return list ?? empty(programId)
}

/** Mirrors the decided transitions so UI review cannot reach a state the rules forbid. */
function expectStatus(list: SongList, allowed: (SongList['status'] | undefined)[]) {
  if (!allowed.includes(list.status)) {
    throw new Error(`DEV FIXTURE: thao tác không hợp lệ ở trạng thái ${list.status ?? 'chưa gửi'}`)
  }
}

export const submitSongListFixture = (programId: string, items: SongListItemInput[]) =>
  writeFixture(() => {
    const previous = songListSnapshot(programId)
    expectStatus(previous, [undefined, 'revisionRequested', 'rejected'])
    const list: SongList = {
      programId,
      status: 'submitted',
      // Resubmission starts a new review round.
      items: items.map((input) => ({ id: nextFixtureId('list-item'), ...input })),
      submittedAt: new Date().toISOString(),
      priestNote: undefined,
      reviewedAt: previous.reviewedAt,
    }
    lists.set(programId, list)
    return list
  })

export const submitSongReviewFixture = (
  programId: string,
  review: { decisions: Record<string, SongReview>; note?: string },
) =>
  writeFixture(() => {
    const previous = songListSnapshot(programId)
    expectStatus(previous, ['submitted'])
    const items = previous.items.map((entry) => ({ ...entry, review: review.decisions[entry.id] }))
    const allAccepted = items.every((entry) => entry.review?.decision === 'accepted')
    const list: SongList = {
      ...previous,
      items,
      status: allAccepted ? 'approved' : 'revisionRequested',
      priestNote: review.note,
      reviewedAt: new Date().toISOString(),
    }
    lists.set(programId, list)
    return list
  })

export const rejectSongListFixture = (programId: string, note: string) =>
  writeFixture(() => {
    expectStatus(songListSnapshot(programId), ['submitted'])
    const list: SongList = {
      ...songListSnapshot(programId),
      status: 'rejected',
      priestNote: note,
      reviewedAt: new Date().toISOString(),
    }
    lists.set(programId, list)
    return list
  })
