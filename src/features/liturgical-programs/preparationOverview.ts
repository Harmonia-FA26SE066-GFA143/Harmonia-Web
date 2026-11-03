import dayjs from 'dayjs'
import type { PreparationStatus, SongListStatus } from './types'

export type PreparationState = 'done' | 'progress' | 'waiting' | 'todo'

export interface PreparationItem {
  label: string
  /** The item's value in words; it always states the state, so colour never carries it alone. */
  value: string
  state: PreparationState
  note?: string
}

export interface PreparationInput {
  /** Celebration date, YYYY-MM-DD. */
  date: string
  songListStatus?: SongListStatus
  /** The counts behind the preparation items; undefined while loading or after an error. */
  status?: PreparationStatus
  failed?: boolean
  /** Who reads the overview: "waiting" marks what waits on that person. */
  viewer: 'director' | 'priest'
}

/**
 * An independent overview of one program's preparation. The backend exposes raw counts, not a required sequence or a
 * "current step", so a later item may be complete while an earlier one is not (EventPreparationStatusDto).
 */
export function preparationItems({ date, songListStatus: songList, status, failed, viewer }: PreparationInput): PreparationItem[] {
  const unknown = failed ? '—' : 'Đang tải…'
  const director = viewer === 'director'
  const days = dayjs(date).startOf('day').diff(dayjs().startOf('day'), 'day')

  const items: PreparationItem[] = [
    !songList || songList === 'draft'
      ? { label: 'Danh sách bài hát', value: songList ? 'Bản nháp' : 'Chưa soạn', state: director ? 'waiting' : 'todo' }
      : { label: 'Danh sách bài hát', value: 'Đã soạn', state: 'done' },
    {
      label: 'Cha xứ duyệt',
      ...({
        none: { value: 'Chưa gửi', state: 'todo' },
        draft: { value: 'Chưa gửi', state: 'todo' },
        submitted: { value: 'Đang chờ duyệt', state: director ? 'progress' : 'waiting' },
        approved: { value: 'Đã duyệt', state: 'done' },
        needsRevision: { value: 'Yêu cầu chỉnh sửa', state: director ? 'waiting' : 'progress' },
        rejected: { value: 'Bị từ chối', state: director ? 'waiting' : 'progress' },
      } as const)[songList ?? 'none'],
    },
  ]

  if (!status) {
    items.push(
      { label: 'Xác nhận tham gia', value: unknown, state: 'todo' },
      { label: 'Chốt phân công', value: unknown, state: 'todo' },
      { label: 'Tập', value: unknown, state: 'todo' },
    )
  } else {
    const { invited, confirmed, declined, unsure } = status.participation
    const invitedTotal = invited + confirmed + declined + unsure
    items.push(
      invitedTotal === 0
        ? { label: 'Xác nhận tham gia', value: 'Chưa mời', state: 'todo' }
        : {
            label: 'Xác nhận tham gia',
            value: `${confirmed}/${invitedTotal} đã nhận lời`,
            state: invited + unsure === 0 ? 'done' : 'progress',
          },
    )
    const shortages = status.rosterShortages?.length ?? 0
    items.push(
      status.rosterFinalized === undefined
        ? { label: 'Chốt phân công', value: 'Chưa lập', state: 'todo' }
        : shortages > 0
          ? { label: 'Chốt phân công', value: `Thiếu ${shortages} vị trí`, state: director ? 'waiting' : 'progress' }
          : { label: 'Chốt phân công', value: status.rosterFinalized ? 'Đã chốt' : 'Đang soạn', state: status.rosterFinalized ? 'done' : 'progress' },
    )
    const note = status.practiceExpected > 0 ? `Bài tập: ${status.practicePassed}/${status.practiceExpected} lượt đạt` : undefined
    items.push(
      status.rehearsalsTotal === 0
        ? { label: 'Tập', value: 'Chưa có buổi tập', state: 'todo', note }
        : {
            label: 'Tập',
            value: `${status.rehearsalsHeld}/${status.rehearsalsTotal} buổi đã tập`,
            state: status.rehearsalsHeld >= status.rehearsalsTotal ? 'done' : 'progress',
            note,
          },
    )
  }

  items.push({
    label: 'Cử hành',
    value: days > 0 ? `Còn ${days} ngày` : days === 0 ? 'Hôm nay' : 'Đã cử hành',
    state: days < 0 ? 'done' : 'todo',
  })

  return items
}
