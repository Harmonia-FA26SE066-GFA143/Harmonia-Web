import { Card, Flex, Tooltip, Typography } from 'antd'
import type { CSSProperties, ReactNode } from 'react'
import { CardTitle, ErrorState, SectionSkeleton } from '@/shared/ui'
import { colors, outcomeColors, spacing, typography } from '@/styles/tokens'
import { cellCount } from '../directorReport'
import { useReport } from '../hooks/useReports'
import type { DirectorReportKind, ReportFilters, ReportRow } from '../types'

export interface WatchMark {
  key: string
  label: string
  color: string
}

export interface MemberWatchProps {
  kind: DirectorReportKind
  filters: ReportFilters
  title: string
  subtitle: string
  /** The counts of a row's bar, in order, with their words. */
  marks: readonly WatchMark[]
  /** The members needing attention among the loaded rows, most first (at most five are shown). */
  rank: (rows: ReportRow[]) => ReportRow[]
  /** The short figure at the end of a member's line. */
  tail: (row: ReportRow) => string
  /** What to say when nobody needs attention, from the loaded rows. */
  empty: (rows: ReportRow[]) => ReactNode
  legend: string
  loadingLabel: string
  errorTitle: string
  /** Optional line above the list, from the loaded rows. */
  lead?: (rows: ReportRow[]) => ReactNode
  style?: CSSProperties
}

const shown = 5

/**
 * "Cần quan tâm" card: the members a per-member report ranks first in the period, each with a bar of their counts.
 * The first page (100 members, the backend maximum) is ranked; the card says so when the period holds more.
 */
export function MemberWatch({ kind, filters, title, subtitle, marks, rank, tail, empty, legend, loadingLabel, errorTitle, lead, style }: Readonly<MemberWatchProps>) {
  const report = useReport(kind, filters, { pageNumber: 1, pageSize: 100 })
  const items = report.data?.items ?? []
  const ranked = rank(items)
  const rows = ranked.slice(0, shown)
  const pad = { padding: spacing.lg }

  return (
    <Card
      title={<CardTitle>{title}</CardTitle>}
      extra={<Typography.Text style={{ color: colors.textMuted }}>{subtitle}</Typography.Text>}
      styles={{ body: { padding: 0 } }}
      style={style}
      aria-busy={report.isFetching}
    >
      {report.isPending && <div style={pad}><SectionSkeleton rows={3} label={loadingLabel} /></div>}
      {report.isError && (
        <div style={pad}>
          <ErrorState headingLevel={3} title={errorTitle} error={report.error} onRetry={() => report.refetch()} retrying={report.isFetching} />
        </div>
      )}
      {report.isSuccess && lead?.(items)}
      {report.isSuccess && rows.length === 0 && (
        <Typography.Paragraph style={{ color: colors.textMuted, margin: 0, ...pad }}>{empty(items)}</Typography.Paragraph>
      )}
      {rows.length > 0 && (
        <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {rows.map((row, index) => {
            const words = marks.filter(({ key }) => cellCount(row, key)).map(({ key, label }) => `${cellCount(row, key)} ${label}`).join(', ')
            return (
              <li
                key={row.id}
                style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 112px 116px', gap: spacing.sm + 4, alignItems: 'center', padding: `${spacing.sm + spacing.xs}px ${spacing.lg}px`, borderTop: `1px solid ${colors.border}` }}
              >
                <Typography.Text ellipsis={{ tooltip: String(row.cells.fullName ?? '') }} style={{ fontWeight: 500, color: colors.textPrimary }}>
                  {row.cells.fullName}
                </Typography.Text>
                <Tooltip title={`${row.cells.fullName}: ${words}`} trigger={['hover', 'focus']}>
                  <Flex role="img" tabIndex={0} aria-label={`${row.cells.fullName}: ${words}`} className="mg-fill" style={{ '--i': index, height: 8, borderRadius: 4, overflow: 'hidden', background: colors.softSurface } as CSSProperties}>
                    {marks.map(({ key, color }) => (cellCount(row, key) ? <span key={key} style={{ flex: cellCount(row, key), background: color }} /> : null))}
                  </Flex>
                </Tooltip>
                <Typography.Text style={{ textAlign: 'end', color: colors.textMuted, whiteSpace: 'nowrap' }}>{tail(row)}</Typography.Text>
              </li>
            )
          })}
        </ol>
      )}
      {report.isSuccess && (rows.length > 0 || report.data.totalCount > items.length) && (
        <Typography.Paragraph style={{ color: colors.textMuted, fontSize: typography.metadata.fontSize, margin: 0, padding: `${spacing.sm}px ${spacing.lg}px ${spacing.md}px` }}>
          {ranked.length > shown && `Hiển thị ${shown}/${ranked.length} ca viên cần quan tâm. `}
          {rows.length > 0 && legend}
          {/* One page of the report is ranked here; say so when the period holds more members than it. */}
          {report.data.totalCount > items.length && ` Xếp trong ${items.length} ca viên đầu của ${report.data.totalCount} người trong kỳ.`}
        </Typography.Paragraph>
      )}
    </Card>
  )
}

const attendanceMarks = [
  { key: 'presentCount', label: 'có mặt', color: outcomeColors.good },
  { key: 'lateCount', label: 'đi trễ', color: outcomeColors.late },
  { key: 'excusedCount', label: 'vắng có phép', color: outcomeColors.excused },
  { key: 'absentCount', label: 'vắng', color: outcomeColors.missed },
] as const

/**
 * "Cần quan tâm": the members absent most in the period, from the attendance report of the same filters
 * (`GET /api/reports/rehearsal-attendance`), each with a bar of their roll calls. Absences count before excused ones.
 */
export function AttendanceWatch({ filters, style }: Readonly<{ filters: ReportFilters; style?: CSSProperties }>) {
  return (
    <MemberWatch
      kind="rehearsalAttendance"
      filters={filters}
      style={style}
      title="Cần quan tâm"
      subtitle="vắng nhiều nhất kỳ"
      marks={attendanceMarks}
      rank={(rows) =>
        rows
          .filter((row) => cellCount(row, 'absentCount') + cellCount(row, 'excusedCount') > 0)
          .toSorted((a, b) => cellCount(b, 'absentCount') - cellCount(a, 'absentCount') || cellCount(b, 'excusedCount') - cellCount(a, 'excusedCount'))
      }
      tail={(row) => (cellCount(row, 'absentCount') ? `${cellCount(row, 'absentCount')} vắng` : `${cellCount(row, 'excusedCount')} có phép`)}
      empty={() => 'Không ca viên nào vắng trong kỳ này.'}
      legend="Thanh: có mặt · đi trễ · có phép · vắng, cùng màu với biểu đồ."
      loadingLabel="Đang tải ca viên vắng"
      errorTitle="Không thể tải điểm danh"
    />
  )
}
