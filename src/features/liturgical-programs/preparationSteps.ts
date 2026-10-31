import dayjs from 'dayjs'
import type { PreparationStatus, SongListStatus } from './types'

export type StepState = 'done' | 'current' | 'waiting' | 'todo'

export interface PreparationStep {
  label: string
  /** The step's value in words; it always states the state, so colour never carries it alone. */
  value: string
  state: StepState
  note?: string
}

export interface PreparationInput {
  /** Celebration date, YYYY-MM-DD. */
  date: string
  songListStatus?: SongListStatus
  /** The counts behind steps 3–5; undefined while loading or after an error. */
  status?: PreparationStatus
  failed?: boolean
  /** Who reads the steps: "waiting" marks what waits on that person. */
  viewer: 'director' | 'priest'
}

type Raw = Omit<PreparationStep, 'state'> & { state: 'done' | 'progress' | 'waiting' | 'todo' }

/**
 * The preparation of one program as the brief's six numbered steps (interpreted, 2026-10-31): the BE has no step
 * sequence, only the counts behind each step (`EventPreparationStatusDto`), so each step's state is read from them.
 * The first step not done is the current one; the celebration itself is the sixth, a real date, not decoration.
 */
export function preparationSteps({ date, songListStatus: songList, status, failed, viewer }: PreparationInput): PreparationStep[] {
  const unknown = failed ? '—' : 'Đang tải…'
  const director = viewer === 'director'
  const days = dayjs(date).startOf('day').diff(dayjs().startOf('day'), 'day')

  const raw: Raw[] = [
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
    raw.push(
      { label: 'Xác nhận tham gia', value: unknown, state: 'todo' },
      { label: 'Chốt phân công', value: unknown, state: 'todo' },
      { label: 'Tập', value: unknown, state: 'todo' },
    )
  } else {
    const { invited, confirmed, declined, unsure } = status.participation
    const invitedTotal = invited + confirmed + declined + unsure
    raw.push(
      invitedTotal === 0
        ? { label: 'Xác nhận tham gia', value: 'Chưa mời', state: 'todo' }
        : {
            label: 'Xác nhận tham gia',
            value: `${confirmed}/${invitedTotal} đã nhận lời`,
            // Everyone invited has answered.
            state: invited + unsure === 0 ? 'done' : 'progress',
          },
    )
    const shortages = status.rosterShortages?.length ?? 0
    raw.push(
      status.rosterFinalized === undefined
        ? { label: 'Chốt phân công', value: 'Chưa lập', state: 'todo' }
        : shortages > 0
          ? { label: 'Chốt phân công', value: `Thiếu ${shortages} vị trí`, state: director ? 'waiting' : 'progress' }
          : { label: 'Chốt phân công', value: status.rosterFinalized ? 'Đã chốt' : 'Đang soạn', state: status.rosterFinalized ? 'done' : 'progress' },
    )
    const note = status.practiceExpected > 0 ? `Bài tập: ${status.practicePassed}/${status.practiceExpected} lượt đạt` : undefined
    raw.push(
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

  raw.push({
    label: 'Cử hành',
    value: days > 0 ? `Còn ${days} ngày` : days === 0 ? 'Hôm nay' : 'Đã cử hành',
    state: days < 0 ? 'done' : 'todo',
  })

  const current = currentStepIndex(raw)
  return raw.map((step, index) => ({
    ...step,
    state: step.state === 'done' || step.state === 'waiting' ? step.state : index === current ? 'current' : 'todo',
  }))
}

/** The first step not done; the last one once everything is. */
export const currentStepIndex = (steps: { state: string }[]) => {
  const index = steps.findIndex((step) => step.state !== 'done')
  return index === -1 ? steps.length - 1 : index
}
