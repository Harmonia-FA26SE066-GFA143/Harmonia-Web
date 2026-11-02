import { Card, Flex, Typography } from 'antd'
import type { CSSProperties } from 'react'
import { CardTitle, ErrorState, SectionSkeleton } from '@/shared/ui'
import { colors, outcomeColors, spacing, typography } from '@/styles/tokens'
import { useReport } from '../hooks/useReports'
import type { ReportFilters } from '../types'

const marks = [
  { key: 'presentCount', label: 'có mặt', color: outcomeColors.good },
  { key: 'lateCount', label: 'đi trễ', color: outcomeColors.late },
  { key: 'excusedCount', label: 'vắng có phép', color: outcomeColors.excused },
  { key: 'absentCount', label: 'vắng', color: outcomeColors.missed },
] as const

const shown = 5

/**
 * "Cần quan tâm": the members absent most in the period, from the attendance report of the same filters
 * (`GET /api/reports/rehearsal-attendance`), each with a bar of their roll calls. Absences count before excused ones.
 */
export function AttendanceWatch({ filters, style }: Readonly<{ filters: ReportFilters; style?: CSSProperties }>) {
  const report = useReport('rehearsalAttendance', filters, { pageNumber: 1, pageSize: 100 })
  const count = (cells: Record<string, string | number | undefined>, key: string) => Number(cells[key] ?? 0)
  const rows = (report.data?.items ?? [])
    .map((row) => ({ ...row, missed: count(row.cells, 'absentCount'), excused: count(row.cells, 'excusedCount') }))
    .filter((row) => row.missed + row.excused > 0)
    .toSorted((a, b) => b.missed - a.missed || b.excused - a.excused)
    .slice(0, shown)

  return (
    <Card title={<CardTitle>Cần quan tâm</CardTitle>} extra={<Typography.Text style={{ color: colors.textMuted }}>vắng nhiều nhất kỳ</Typography.Text>} styles={{ body: { padding: 0 } }} style={style}>
      {report.isPending && <div style={{ padding: spacing.lg }}><SectionSkeleton rows={3} label="Đang tải ca viên vắng" /></div>}
      {report.isError && (
        <div style={{ padding: spacing.lg }}>
          <ErrorState headingLevel={3} title="Không thể tải điểm danh" error={report.error} onRetry={() => report.refetch()} retrying={report.isFetching} />
        </div>
      )}
      {report.isSuccess && rows.length === 0 && (
        <Typography.Paragraph style={{ color: colors.textMuted, margin: 0, padding: spacing.lg }}>Không ca viên nào vắng trong kỳ này.</Typography.Paragraph>
      )}
      {rows.length > 0 && (
        <>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {rows.map((row) => {
              const words = marks.filter(({ key }) => count(row.cells, key)).map(({ key, label }) => `${count(row.cells, key)} ${label}`).join(', ')
              return (
                <li
                  key={row.id}
                  style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 120px 72px', gap: spacing.md, alignItems: 'center', padding: `10px ${spacing.lg}px`, borderTop: `1px solid ${colors.border}` }}
                >
                  <Typography.Text ellipsis style={{ fontWeight: 500, color: colors.textPrimary }}>
                    {row.cells.fullName}
                  </Typography.Text>
                  <Flex role="img" aria-label={`${row.cells.fullName}: ${words}`} style={{ height: 8, borderRadius: 4, overflow: 'hidden', background: colors.softSurface }}>
                    {marks.map(({ key, color }) => (count(row.cells, key) ? <span key={key} style={{ flex: count(row.cells, key), background: color }} /> : null))}
                  </Flex>
                  <Typography.Text style={{ textAlign: 'end', color: colors.textMuted, fontVariantNumeric: 'tabular-nums' }}>
                    {row.missed ? `${row.missed} vắng` : `${row.excused} có phép`}
                  </Typography.Text>
                </li>
              )
            })}
          </ol>
          <Typography.Paragraph style={{ color: colors.textMuted, fontSize: typography.metadata.fontSize, margin: 0, padding: `${spacing.sm}px ${spacing.lg}px ${spacing.md}px` }}>
            Thanh: có mặt · đi trễ · có phép · vắng, cùng màu với biểu đồ.
          </Typography.Paragraph>
        </>
      )}
    </Card>
  )
}
