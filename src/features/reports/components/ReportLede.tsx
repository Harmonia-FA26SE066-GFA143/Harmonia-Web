import { Card, Flex, Typography } from 'antd'
import type { Dayjs } from 'dayjs'
import { ErrorState, SectionSkeleton } from '@/shared/ui'
import { colors, sections, spacing, typography } from '@/styles/tokens'
import { periodOf, type Granularity } from '../directorReport'
import { useActivityTrend, useReport } from '../hooks/useReports'
import type { ActivityTrendPoint } from '../types'

export interface ReportLedeProps {
  granularity: Granularity
  anchor: Dayjs
  choirId?: string
}

/** The period before, in words: "tuần trước", "tháng 10", "năm 2025". */
function previousName(granularity: Granularity, anchor: Dayjs) {
  const previous = anchor.subtract(1, granularity)
  if (granularity === 'week') return 'tuần trước'
  return granularity === 'month' ? `tháng ${previous.month() + 1}` : `năm ${previous.year()}`
}

/** The period itself, in words: "Tuần 02/11", "Tháng 11/2026", "Năm 2026". */
function periodName(granularity: Granularity, from: string, anchor: Dayjs) {
  if (granularity === 'week') return `Tuần ${from.slice(8, 10)}/${from.slice(5, 7)}`
  return granularity === 'month' ? `Tháng ${anchor.format('MM/YYYY')}` : `Năm ${anchor.year()}`
}

function Figure({
  label,
  rate,
  previous,
  since,
  basis,
  none,
}: Readonly<{ label: string; rate?: number; previous?: number; since: string; basis: string; none: string }>) {
  const points = rate !== undefined && previous !== undefined ? Math.round(rate * 100) - Math.round(previous * 100) : undefined
  return (
    <div style={{ padding: `${spacing.lg}px ${spacing.xl}px` }}>
      <Typography.Text style={{ color: colors.textMuted, fontSize: typography.metadata.fontSize }}>{label}</Typography.Text>
      {rate === undefined ? (
        <Typography.Paragraph style={{ color: colors.textMuted, margin: `${spacing.md}px 0 0` }}>{none}</Typography.Paragraph>
      ) : (
        <>
          <div style={{ fontFamily: typography.displayFontFamily, fontWeight: 600, fontSize: 64, lineHeight: 1, color: colors.textPrimary, fontVariantNumeric: 'lining-nums' }}>
            {Math.round(rate * 100)}
            <span style={{ fontSize: 32 }}>%</span>
          </div>
          {points !== undefined && (
            <Typography.Text
              style={{ display: 'block', marginTop: spacing.xs, fontWeight: 500, color: points < 0 ? sections.attention.ink : sections.rehearsal.ink }}
            >
              {points === 0 ? `Bằng ${since}` : `${points > 0 ? '▲' : '▼'} ${Math.abs(points)} điểm so với ${since}`}
            </Typography.Text>
          )}
          <Typography.Text style={{ display: 'block', color: colors.textMuted, fontSize: typography.metadata.fontSize }}>{basis}</Typography.Text>
        </>
      )}
    </div>
  )
}

/**
 * The opening of the Choir Director's report: attendance and practice completion of the period as two figures, each
 * against the period before (`GET /api/reports/activity-trend` over both, one point each), and the period in three
 * sentences. Members absent twice or more come from the attendance report of the period.
 */
export function ReportLede({ granularity, anchor, choirId }: Readonly<ReportLedeProps>) {
  const period = periodOf(granularity, anchor)
  const before = periodOf(granularity, anchor.subtract(1, granularity))
  const trend = useActivityTrend({ groupBy: granularity, fromDate: before.from, toDate: period.to, choirId })
  const members = useReport('rehearsalAttendance', { fromDate: period.from, toDate: period.to, choirId }, { pageNumber: 1, pageSize: 100 })

  if (trend.isPending) return <SectionSkeleton rows={3} label="Đang tải số liệu của kỳ" />
  if (trend.isError) {
    return <ErrorState headingLevel={2} title="Không thể tải số liệu của kỳ" error={trend.error} onRetry={() => trend.refetch()} retrying={trend.isFetching} />
  }
  const points = trend.data
  const now: ActivityTrendPoint | undefined = points.find((point) => point.periodStart >= period.from)
  const then = points.find((point) => point.periodEnd < period.from)
  const since = previousName(granularity, anchor)
  const marked = now ? now.presentCount + now.lateCount + now.absentCount + now.excusedCount : 0
  const absentTwice = members.data?.items.filter((row) => Number(row.cells.absentCount ?? 0) >= 2).length

  const sentences = [
    now?.rehearsalsRecorded ? (
      <>
        <b>{now.rehearsalsRecorded} buổi tập</b> đã điểm danh.
      </>
    ) : (
      'Chưa có buổi tập nào được điểm danh.'
    ),
    absentTwice === undefined ? null : absentTwice ? (
      <>
        <b>{absentTwice} ca viên</b> vắng từ hai buổi trở lên.
      </>
    ) : (
      'Không ca viên nào vắng quá một buổi.'
    ),
    now?.assignedCount ? (
      <>
        Bài tập đến hạn: <b>{now.awaitingReviewCount}</b> chờ nhận xét, <b>{now.needsRevisionCount}</b> cần chỉnh sửa,{' '}
        <b>{now.notSubmittedCount}</b> chưa nộp.
      </>
    ) : (
      'Không có bài tập nào đến hạn.'
    ),
  ].filter(Boolean)

  return (
    <Card styles={{ body: { padding: 0 } }} style={{ marginBottom: spacing.md, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.25fr' }}>
        <Figure
          label="Chuyên cần"
          rate={now?.attendanceRate}
          previous={then?.attendanceRate}
          since={since}
          basis={`có mặt hoặc đi trễ trên ${marked} lượt điểm danh`}
          none="Chưa có lượt điểm danh nào."
        />
        <div style={{ borderInlineStart: `1px solid ${colors.border}` }}>
          <Figure
            label="Hoàn thành bài tập"
            rate={now?.completionRate}
            previous={then?.completionRate}
            since={since}
            basis={`${now?.passedCount ?? 0} trên ${now?.assignedCount ?? 0} lượt giao đã đạt`}
            none="Chưa có bài tập nào đến hạn."
          />
        </div>
        <Flex vertical gap={spacing.xs} style={{ padding: `${spacing.lg}px ${spacing.xl}px`, background: colors.ivory }}>
          <Typography.Text style={{ color: colors.textMuted, fontSize: typography.metadata.fontSize }}>{periodName(granularity, period.from, anchor)}, nói gọn</Typography.Text>
          {sentences.map((sentence, index) => (
            <Typography.Text key={index} style={{ color: colors.textPrimary, fontSize: 15 }}>
              {sentence}
            </Typography.Text>
          ))}
        </Flex>
      </div>
    </Card>
  )
}
