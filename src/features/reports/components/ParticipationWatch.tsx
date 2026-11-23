import { Card, Flex, Typography } from 'antd'
import type { CSSProperties } from 'react'
import { CardTitle, ErrorState, SectionSkeleton } from '@/shared/ui'
import { colors, outcomeColors, spacing, typography } from '@/styles/tokens'
import { cellCount, memberScope, participationTotals, percent } from '../directorReport'
import { useReport } from '../hooks/useReports'
import type { ReportFilters, ReportRow } from '../types'
import { MemberWatch } from './AttendanceWatch'

// Words of `ParticipationStatus` as the practice progress tab names them.
const answers = [
  { key: 'confirmed', cell: 'confirmedCount', label: 'Xác nhận', color: outcomeColors.good },
  { key: 'unsure', cell: 'unsureCount', label: 'Chưa chắc chắn', color: outcomeColors.late },
  { key: 'invited', cell: 'invitedCount', label: 'Chưa phản hồi', color: outcomeColors.excused },
  { key: 'declined', cell: 'declinedCount', label: 'Từ chối', color: outcomeColors.missed },
] as const

const watchMarks = answers.map(({ cell, label, color }) => ({ key: cell, label: label.toLowerCase(), color }))

const pending = (row: ReportRow) => cellCount(row, 'invitedCount') + cellCount(row, 'unsureCount')

/** The period's answers to participation requests, one bar per answer with its count and share. */
function ResponseBreakdown({ filters }: Readonly<{ filters: ReportFilters }>) {
  const report = useReport('participation', filters, { pageNumber: 1, pageSize: 100 })
  const sum = participationTotals(report.data?.items ?? [])

  return (
    <Card title={<CardTitle>Phân bố phản hồi trong kỳ</CardTitle>} aria-busy={report.isFetching}>
      {report.isPending && <SectionSkeleton rows={4} label="Đang tải phản hồi tham gia" />}
      {report.isError && (
        <ErrorState headingLevel={3} title="Không thể tải phản hồi tham gia" error={report.error} onRetry={() => report.refetch()} retrying={report.isFetching} />
      )}
      {report.isSuccess && sum.sent === 0 && (
        <Typography.Text style={{ color: colors.textMuted }}>Chưa có lời mời tham gia nào trong kỳ này.</Typography.Text>
      )}
      {report.isSuccess && sum.sent > 0 && (
        <Flex vertical gap={spacing.md}>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: spacing.md }}>
            {answers.map(({ key, label, color }, index) => (
              <li key={key} style={{ display: 'grid', gridTemplateColumns: '128px minmax(0, 1fr) 96px', gap: spacing.md, alignItems: 'center' }}>
                <Typography.Text>{label}</Typography.Text>
                <div aria-hidden style={{ height: 10, borderRadius: 5, background: colors.softSurface, overflow: 'hidden' }}>
                  <div className="mg-fill" style={{ '--i': index, width: `${(sum[key] / sum.sent) * 100}%`, height: '100%', background: color } as CSSProperties} />
                </div>
                <Typography.Text style={{ textAlign: 'end' }}>
                  {sum[key]} · {percent(sum[key], sum.sent)}
                </Typography.Text>
              </li>
            ))}
          </ul>
          <Typography.Text style={{ color: colors.textMuted, fontSize: typography.metadata.fontSize }}>
            {sum.sent} lượt mời, {memberScope(report.data.items.length, report.data.totalCount)}.
          </Typography.Text>
        </Flex>
      )}
    </Card>
  )
}

/**
 * Participation band of the Choir Director's reports: the period's answers and the members to follow up, both from
 * `GET /api/reports/participation` (one shared query). Two sibling cards, placed in the page's `.ctb-report-split`.
 */
export function ParticipationWatch({ filters }: Readonly<{ filters: ReportFilters }>) {
  return (
    <>
      <ResponseBreakdown filters={filters} />
      <MemberWatch
        kind="participation"
        filters={filters}
        title="Cần quan tâm — phản hồi tham gia"
        subtitle="chưa trả lời, từ chối"
        marks={watchMarks}
        rank={(rows) =>
          rows
            .filter((row) => pending(row) + cellCount(row, 'declinedCount') > 0)
            .toSorted(
              (a, b) =>
                pending(b) - pending(a) ||
                cellCount(b, 'invitedCount') - cellCount(a, 'invitedCount') ||
                cellCount(b, 'declinedCount') - cellCount(a, 'declinedCount'),
            )
        }
        tail={(row) => {
          if (cellCount(row, 'invitedCount') > 0) return `${cellCount(row, 'invitedCount')} chưa phản hồi`
          if (cellCount(row, 'unsureCount') > 0) return `${cellCount(row, 'unsureCount')} chưa chắc`
          return `${cellCount(row, 'declinedCount')} từ chối`
        }}
        empty={(rows) => {
          if (rows.length === 0) return 'Chưa có ca viên nào trong kỳ này.'
          if (participationTotals(rows).sent === 0) return 'Chưa có lời mời tham gia nào trong kỳ này.'
          return 'Mọi lời mời trong kỳ đều đã được xác nhận.'
        }}
        legend="Thanh: xác nhận · chưa chắc chắn · chưa phản hồi · từ chối."
        loadingLabel="Đang tải phản hồi tham gia"
        errorTitle="Không thể tải phản hồi tham gia"
      />
    </>
  )
}
