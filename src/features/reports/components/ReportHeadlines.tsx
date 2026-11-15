import { ErrorState, SectionSkeleton } from '@/shared/ui'
import { useActivityTrend } from '../hooks/useReports'
import type { ActivityTrendPoint, ActivityTrendQuery, DirectorReportKind } from '../types'

type Counts = Omit<ActivityTrendPoint, 'periodStart' | 'periodEnd' | 'attendanceRate' | 'completionRate'>

const percent = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : '—')

/** The period's points added up; the rates are recomputed from the sums. */
function total(points: ActivityTrendPoint[]): Counts {
  const keys: (keyof Counts)[] = [
    'rehearsalsRecorded', 'presentCount', 'lateCount', 'absentCount', 'excusedCount',
    'assignmentsDue', 'assignedCount', 'passedCount', 'needsRevisionCount', 'awaitingReviewCount', 'notSubmittedCount',
  ]
  return Object.fromEntries(keys.map((key) => [key, points.reduce((sum, point) => sum + point[key], 0)])) as Counts
}

function figuresOf(kind: DirectorReportKind, sum: Counts) {
  if (kind === 'rehearsalAttendance') {
    const marked = sum.presentCount + sum.lateCount + sum.absentCount + sum.excusedCount
    return [
      { label: 'Buổi tập đã ghi nhận', value: String(sum.rehearsalsRecorded), note: 'buổi' },
      { label: 'Tỉ lệ có mặt', value: percent(sum.presentCount + sum.lateCount, marked), note: 'có mặt hoặc đi muộn' },
      { label: 'Đi muộn', value: String(sum.lateCount), note: 'lượt' },
      { label: 'Vắng không phép', value: String(sum.absentCount), note: 'lượt' },
    ]
  }
  return [
    { label: 'Bài tập đến hạn', value: String(sum.assignmentsDue), note: `${sum.assignedCount} lượt giao` },
    { label: 'Tỉ lệ hoàn thành', value: percent(sum.passedCount, sum.assignedCount), note: 'đạt trên lượt giao' },
    { label: 'Chờ nhận xét', value: String(sum.awaitingReviewCount), note: 'bản thu' },
    { label: 'Chưa nộp', value: String(sum.notSubmittedCount), note: 'lượt' },
  ]
}

/**
 * Four headline figures of the open report on reading cards (artifact ReportsPage), from `GET /api/reports/activity-trend`
 * over the period. Participation has no period aggregate in the backend (TBD: Backend API missing), so it has none.
 */
export function ReportHeadlines({ kind, query }: Readonly<{ kind: DirectorReportKind; query: ActivityTrendQuery }>) {
  const trend = useActivityTrend(query)
  if (kind === 'participation') return null
  if (trend.isPending) return <SectionSkeleton rows={2} label="Đang tải số liệu của kỳ" />
  if (trend.isError) {
    return <ErrorState headingLevel={2} title="Không thể tải số liệu của kỳ" error={trend.error} onRetry={() => trend.refetch()} retrying={trend.isFetching} />
  }
  return (
    <div className="ctb-figures">
      {figuresOf(kind, total(trend.data)).map((figure) => (
        <div key={figure.label} className="ctb-figure">
          <span>{figure.label}</span>
          <b>{figure.value}</b>
          <small>{figure.note}</small>
        </div>
      ))}
    </div>
  )
}
