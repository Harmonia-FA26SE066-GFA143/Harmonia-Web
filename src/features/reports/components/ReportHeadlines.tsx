import { ATTENDANCE_LATE_LABEL, ErrorState, SectionSkeleton, UNKNOWN_METRIC_LABEL } from '@/shared/ui'
import { memberScope, participationTotals, percent } from '../directorReport'
import { useActivityTrend, useReport } from '../hooks/useReports'
import type { ActivityTrendPoint, ActivityTrendQuery, DirectorReportKind } from '../types'

type Counts = Omit<ActivityTrendPoint, 'periodStart' | 'periodEnd' | 'attendanceRate' | 'completionRate'>
interface Figure {
  label: string
  value: string
  note: string
}

/** The period's points added up; the rates are recomputed from the sums. */
function total(points: ActivityTrendPoint[]): Counts {
  const keys: (keyof Counts)[] = [
    'rehearsalsRecorded', 'presentCount', 'lateCount', 'absentCount', 'excusedCount',
    'assignmentsDue', 'assignedCount', 'passedCount', 'needsRevisionCount', 'awaitingReviewCount', 'notSubmittedCount',
  ]
  return Object.fromEntries(keys.map((key) => [key, points.reduce((sum, point) => sum + point[key], 0)])) as Counts
}

function figuresOf(kind: Exclude<DirectorReportKind, 'participation'>, sum: Counts): Figure[] {
  if (kind === 'rehearsalAttendance') {
    const marked = sum.presentCount + sum.lateCount + sum.absentCount + sum.excusedCount
    return [
      { label: 'Buổi tập đã ghi nhận', value: String(sum.rehearsalsRecorded), note: 'buổi' },
      { label: 'Tỉ lệ có mặt', value: percent(sum.presentCount + sum.lateCount, marked), note: 'có mặt hoặc đi trễ' },
      { label: ATTENDANCE_LATE_LABEL, value: String(sum.lateCount), note: 'lượt' },
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

/** `busy`: the previous period's figures stay while the new ones load (keepPreviousData); said to assistive tech. */
function Figures({ figures, busy }: Readonly<{ figures: Figure[]; busy: boolean }>) {
  return (
    <div className="ctb-figures" aria-busy={busy}>
      {figures.map((figure) => (
        <div key={figure.label} className="ctb-figure">
          <span>{figure.label}</span>
          <b className={figure.value === UNKNOWN_METRIC_LABEL ? 'is-unknown' : undefined}>{figure.value}</b>
          <small>{figure.note}</small>
        </div>
      ))}
    </div>
  )
}

/**
 * Four headline figures of the open report on reading cards (artifact ReportsPage). Attendance and practice add up
 * `GET /api/reports/activity-trend` over the period; participation, which that endpoint does not carry, adds up the
 * rows of `GET /api/reports/participation` (first 100 members, said when there are more).
 */
export function ReportHeadlines({ kind, query }: Readonly<{ kind: DirectorReportKind; query: ActivityTrendQuery }>) {
  const isParticipation = kind === 'participation'
  const trend = useActivityTrend(query, !isParticipation)
  const participation = useReport(
    'participation',
    { fromDate: query.fromDate, toDate: query.toDate, choirId: query.choirId },
    { pageNumber: 1, pageSize: 100 },
    isParticipation,
  )
  const source = isParticipation ? participation : trend
  if (source.isPending) return <SectionSkeleton rows={2} label="Đang tải số liệu của kỳ" />
  if (source.isError) {
    return <ErrorState headingLevel={2} title="Không thể tải số liệu của kỳ" error={source.error} onRetry={() => source.refetch()} retrying={source.isFetching} />
  }
  if (isParticipation) {
    if (!participation.data) return null
    const { items, totalCount } = participation.data
    const sum = participationTotals(items)
    return (
      <Figures
        busy={participation.isFetching}
        figures={[
          { label: 'Lượt mời đã gửi', value: String(sum.sent), note: memberScope(items.length, totalCount) },
          { label: 'Tỉ lệ xác nhận', value: percent(sum.confirmed, sum.sent), note: 'xác nhận trên tổng lời mời' },
          { label: 'Đã xác nhận', value: String(sum.confirmed), note: 'lượt đồng ý' },
          { label: 'Chưa phản hồi', value: String(sum.invited), note: `${sum.declined} từ chối · ${sum.unsure} chưa chắc` },
        ]}
      />
    )
  }
  return trend.data ? <Figures busy={trend.isFetching} figures={figuresOf(kind, total(trend.data))} /> : null
}
