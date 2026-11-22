import type { ReactNode } from 'react'
import { generatePath } from 'react-router'
import { paths } from '@/app/router/paths'
import {
  formatProgramDate,
  preparationItems,
  type PreparationState,
  type ProgramListItem,
  type usePreparationStatus,
} from '@/features/liturgical-programs'
import { LOADING_COUNT_LABEL, type IconName } from '@/shared/ui'

/** `EventPreparationStatusDto` as the Web reads it (the feature's index does not export the type). */
type PreparationStatus = NonNullable<ReturnType<typeof usePreparationStatus>['data']>

export interface PreparationStep {
  key: string
  title: string
  icon: IconName
  state: PreparationState
  /** The step's value in words; it always states the state, so colour never carries it alone. */
  value: string
  detail?: ReactNode
  to: string
  /** The words of the primary button when this step is the most urgent one. */
  action: string
  links?: { to: string; text: string }[]
}

interface StepInput {
  program: ProgramListItem
  status?: PreparationStatus
  failed: boolean
  /** Recordings waiting for a grade over every program (`GET /api/practice-submissions?status=Submitted`). */
  reviewCount?: number
}

/**
 * The five steps of preparing one Mass for the Choir Director, every value from `ProgramListItem` and
 * `EventPreparationStatusDto` (Harmonia-BE EventPreparationStatusDto.cs). The backend has no required order or
 * "current step", so each step stands on its own; an unknown count reads "Đang tải…" or "—", never 0.
 */
export function preparationSteps({ program, status, failed, reviewCount }: StepInput): PreparationStep[] {
  const items = preparationItems({ date: program.date, songListStatus: program.songListStatus, status, failed, viewer: 'director' })
  const item = (label: string) => items.find((entry) => entry.label === label)!
  const query = `?programId=${program.id}`
  const unknown = failed ? '—' : LOADING_COUNT_LABEL

  const list = item('Danh sách bài hát')
  const review = item('Cha xứ duyệt')
  const songList = list.state === 'done' ? review : list
  const listStatus = program.songListStatus
  const songListAction = !listStatus
    ? 'Đề xuất danh sách bài hát'
    : listStatus === 'draft'
      ? 'Mở bản nháp danh sách'
      : listStatus === 'needsRevision' || listStatus === 'rejected'
        ? 'Sửa danh sách bài hát'
        : 'Xem danh sách bài hát'

  const participation = item('Xác nhận tham gia')
  const counts = status?.participation
  const answered =
    counts && counts.invited + counts.confirmed + counts.declined + counts.unsure > 0
      ? [
          counts.declined > 0 && `${counts.declined} từ chối`,
          counts.unsure > 0 && `${counts.unsure} chưa chắc chắn`,
          counts.invited > 0 && `${counts.invited} chưa trả lời`,
        ]
          .filter(Boolean)
          .join(' · ')
      : ''

  const roster = item('Chốt phân công')
  const shortages = status?.rosterShortages ?? []
  const rehearsals = item('Tập')

  const practice: Pick<PreparationStep, 'state' | 'value'> = !status
    ? { state: 'todo', value: unknown }
    : status.practiceExpected === 0
      ? { state: 'todo', value: 'Chưa giao bài' }
      : {
          state: status.practicePassed >= status.practiceExpected ? 'done' : 'progress',
          value: `${status.practicePassed}/${status.practiceExpected} lượt đạt`,
        }

  return [
    {
      key: 'song-list',
      title: 'Danh sách bài hát & Cha xứ duyệt',
      icon: 'song',
      state: songList.state,
      value: songList.value,
      detail: listStatus !== 'approved' && (
        <span className={program.isSongListOverdue ? 'prep-step__due is-overdue' : 'prep-step__due'}>
          {program.isSongListOverdue ? 'Quá hạn gửi' : 'Hạn gửi'} {formatProgramDate(program.songListDueDate)}
        </span>
      ),
      to: generatePath(paths.director.songListProposal, { programId: program.id }),
      action: songListAction,
    },
    {
      key: 'participation',
      title: 'Xác nhận tham gia',
      icon: 'participation',
      state: participation.state,
      value: participation.value,
      detail: answered || undefined,
      to: `${paths.director.participation}${query}`,
      action: 'Mở xác nhận tham gia',
    },
    {
      key: 'roster',
      title: 'Phân công phục vụ',
      icon: 'roster',
      state: roster.state,
      value: roster.value,
      detail: (status?.rosterFinalized !== undefined || shortages.length > 0) && (
        <>
          {status && status.rosterFinalized !== undefined && <span>{status.rosterActiveAssignments} lượt đã phân công</span>}
          {shortages.length > 0 && (
            <ul className="next-mass__shortages" aria-label="Vị trí còn thiếu">
              {shortages.map((shortage) => (
                <li key={`${shortage.skillName}-${shortage.songTitle ?? ''}`} className="hm-missing">
                  Thiếu {shortage.requiredCount - shortage.assignedCount} {shortage.skillName}
                  {shortage.songTitle ? ` · ${shortage.songTitle}` : ''}
                </li>
              ))}
            </ul>
          )}
        </>
      ),
      to: `${paths.director.roster}${query}`,
      action: 'Mở phân công',
    },
    {
      key: 'rehearsals',
      title: 'Buổi tập & Điểm danh',
      icon: 'rehearsal',
      state: rehearsals.state,
      value: rehearsals.value,
      detail: status && status.attendanceExpected > 0 && `Điểm danh: ${status.attendancePresent}/${status.attendanceExpected} lượt có mặt`,
      to: `${paths.director.rehearsals}${query}`,
      action: 'Mở lịch tập',
      links: [{ to: `${paths.director.attendance}${query}`, text: 'Điểm danh' }],
    },
    {
      key: 'practice',
      title: 'Bài tập luyện tập',
      icon: 'practice',
      state: practice.state,
      value: practice.value,
      detail: status && status.practiceOverdue > 0 && `${status.practiceOverdue} lượt quá hạn nộp`,
      to: `${paths.director.practice}${query}`,
      action: 'Mở tiến độ luyện tập',
      links: reviewCount ? [{ to: paths.director.practice, text: `${reviewCount} bản thu chờ chấm` }] : undefined,
    },
  ]
}
