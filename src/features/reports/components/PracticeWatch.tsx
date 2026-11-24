import { Typography } from 'antd'
import { Link } from 'react-router'
import { paths } from '@/app/router/paths'
import { colors, outcomeColors, spacing } from '@/styles/tokens'
import { cellCount } from '../directorReport'
import type { ReportFilters, ReportRow } from '../types'
import { MemberWatch } from './AttendanceWatch'

const practiceMarks = [
  { key: 'passedCount', label: 'đạt', color: outcomeColors.good },
  { key: 'needsRevisionCount', label: 'cần chỉnh sửa', color: outcomeColors.late },
  { key: 'awaitingReviewCount', label: 'chờ nhận xét', color: outcomeColors.excused },
  { key: 'notSubmittedCount', label: 'chưa nộp', color: outcomeColors.missed },
] as const

const sumOf = (rows: ReportRow[], key: string) => rows.reduce((sum, row) => sum + cellCount(row, key), 0)

/**
 * The empty-state wording, from what the backend reports (`PracticeAssignmentCompletionDto`: the newest attempt's
 * state per assignment due in the period). It has no on-time flag, so nothing here says "on time".
 */
function emptyText(rows: ReportRow[]) {
  if (rows.length === 0) return 'Chưa có ca viên nào trong kỳ này.'
  if (sumOf(rows, 'assignedCount') === 0) return 'Chưa có bài tập nào đến hạn trong kỳ này.'
  const awaiting = sumOf(rows, 'awaitingReviewCount')
  // Said once here, with the way to them; the reminder line above the list is not shown when nobody is ranked.
  return awaiting > 0 ? (
    <>
      <span>{`Không ca viên nào chưa nộp hoặc cần chỉnh sửa. Còn ${awaiting} bản thu đang chờ nhận xét.`}</span>{' '}
      <Link to={paths.director.practice}>Chấm bài</Link>
    </>
  ) : (
    'Mọi bài tập đến hạn trong kỳ đều đã đạt.'
  )
}

const needsAttention = (row: ReportRow) => cellCount(row, 'notSubmittedCount') + cellCount(row, 'needsRevisionCount') > 0

function practiceLead(rows: ReportRow[]) {
  const awaiting = sumOf(rows, 'awaitingReviewCount')
  // Only above a ranked list; with nobody ranked the empty state says it (no repeat).
  return awaiting > 0 && rows.some(needsAttention) ? (
    <Typography.Paragraph style={{ margin: 0, padding: `${spacing.sm}px ${spacing.lg}px`, color: colors.textMuted }}>
      {awaiting} bản thu đang chờ nhận xét · <Link to={paths.director.practice}>Chấm bài</Link>
    </Typography.Paragraph>
  ) : null
}

/**
 * "Cần quan tâm" for practice: members with assignments not submitted or to be redone in the period, most not
 * submitted first (`GET /api/reports/assignment-completion`), with a reminder of the recordings waiting for review.
 */
export function PracticeWatch({ filters }: Readonly<{ filters: ReportFilters }>) {
  return (
    <MemberWatch
      kind="assignmentCompletion"
      filters={filters}
      title="Cần quan tâm"
      subtitle="chưa nộp, cần sửa"
      marks={practiceMarks}
      rank={(rows) =>
        rows
          .filter(needsAttention)
          .toSorted(
            (a, b) =>
              cellCount(b, 'notSubmittedCount') - cellCount(a, 'notSubmittedCount') ||
              cellCount(b, 'needsRevisionCount') - cellCount(a, 'needsRevisionCount'),
          )
      }
      tail={(row) =>
        cellCount(row, 'notSubmittedCount') ? `${cellCount(row, 'notSubmittedCount')} chưa nộp` : `${cellCount(row, 'needsRevisionCount')} cần sửa`
      }
      empty={emptyText}
      lead={practiceLead}
      legend="Thanh: đạt · cần chỉnh sửa · chờ nhận xét · chưa nộp, cùng màu với biểu đồ."
      loadingLabel="Đang tải hoàn thành bài tập"
      errorTitle="Không thể tải hoàn thành bài tập"
    />
  )
}
