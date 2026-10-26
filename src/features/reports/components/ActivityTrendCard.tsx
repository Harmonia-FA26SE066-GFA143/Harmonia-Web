import { Card, Flex, Segmented, Spin, Typography } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import { CardTitle, ErrorState, SectionSkeleton } from '@/shared/ui'
import { colors, spacing } from '@/styles/tokens'
import { useActivityTrend } from '../hooks/useReports'
import type { ActivityTrendPoint, ActivityTrendQuery, TrendPeriod } from '../types'
import { StackedBars, type BarSeries, type Bucket } from './StackedBars'

type View = 'attendance' | 'practice'

const attendanceSeries: BarSeries<'presentCount' | 'lateCount' | 'excusedCount' | 'absentCount'>[] = [
  { key: 'presentCount', label: 'Có mặt', color: '#389e0d' },
  { key: 'lateCount', label: 'Đi muộn', color: '#d48806' },
  { key: 'excusedCount', label: 'Vắng có phép', color: '#0958d9' },
  { key: 'absentCount', label: 'Vắng không phép', color: '#cf1322' },
]

const practiceSeries: BarSeries<'passedCount' | 'needsRevisionCount' | 'awaitingReviewCount' | 'notSubmittedCount'>[] = [
  { key: 'passedCount', label: 'Đạt', color: '#389e0d' },
  { key: 'needsRevisionCount', label: 'Cần chỉnh sửa', color: '#d46b08' },
  { key: 'awaitingReviewCount', label: 'Chờ chấm', color: '#0958d9' },
  { key: 'notSubmittedCount', label: 'Chưa nộp', color: '#cf1322' },
]

const percent = (rate?: number) => (rate === undefined ? undefined : `${Math.round(rate * 100)}%`)

/** Short label under a column and its long name, e.g. "T10" / "Tháng 10/2026". */
function bucketOf(point: ActivityTrendPoint, groupBy: TrendPeriod, view: View): Bucket {
  const start = dayjs(point.periodStart)
  const end = dayjs(point.periodEnd)
  const rate =
    view === 'attendance'
      ? percent(point.attendanceRate) && `chuyên cần ${percent(point.attendanceRate)}`
      : percent(point.completionRate) && `hoàn thành ${percent(point.completionRate)}`
  const names: Record<TrendPeriod, Bucket> = {
    week: { label: start.format('DD/MM'), title: `Tuần ${start.format('DD/MM')} – ${end.format('DD/MM/YYYY')}` },
    month: { label: `T${start.month() + 1}`, title: `Tháng ${start.format('MM/YYYY')}` },
    year: { label: start.format('YYYY'), title: `Năm ${start.format('YYYY')}` },
  }
  const bucket = names[groupBy]
  return rate ? { ...bucket, title: `${bucket.title} · ${rate}` } : bucket
}

/**
 * Attendance and practice completion per period, from `GET /api/reports/activity-trend` (Admin, Choir Director): one
 * column per week, month or year, stacked by result. Rehearsals count in the period they start, assignments in the
 * period they are due.
 */
export function ActivityTrendCard({ query, title }: Readonly<{ query: ActivityTrendQuery; title: string }>) {
  const [view, setView] = useState<View>('attendance')
  const trend = useActivityTrend(query)
  const points = trend.data ?? []
  const series = view === 'attendance' ? attendanceSeries : practiceSeries
  const empty = points.every((point) => series.every(({ key }) => point[key] === 0))

  return (
    <Card
      title={<CardTitle>{title}</CardTitle>}
      extra={
        <Segmented<View>
          aria-label="Số liệu của biểu đồ"
          value={view}
          onChange={setView}
          options={[
            { value: 'attendance', label: 'Điểm danh' },
            { value: 'practice', label: 'Bài tập' },
          ]}
        />
      }
      style={{ marginBottom: spacing.lg }}
    >
      {trend.isPending && <SectionSkeleton rows={4} label="Đang tải biểu đồ" />}
      {trend.isError && (
        <ErrorState headingLevel={3} title="Không thể tải biểu đồ" error={trend.error} hasData={trend.data !== undefined} onRetry={() => trend.refetch()} retrying={trend.isFetching} />
      )}
      {trend.data && (
        <Spin spinning={trend.isPlaceholderData}>
          {empty ? (
            <Typography.Text style={{ color: colors.textMuted }}>
              {view === 'attendance' ? 'Chưa có lượt điểm danh nào trong khoảng này.' : 'Chưa có bài tập nào đến hạn trong khoảng này.'}
            </Typography.Text>
          ) : (
            <Flex vertical gap={spacing.sm}>
              <StackedBars
                buckets={points.map((point) => bucketOf(point, query.groupBy, view))}
                values={points}
                series={series}
              />
              <Typography.Text style={{ color: colors.textMuted }}>
                {view === 'attendance'
                  ? 'Buổi tập tính vào kỳ có giờ bắt đầu; chuyên cần là có mặt và đi muộn trên tổng lượt điểm danh.'
                  : 'Bài tập tính vào kỳ có hạn nộp, theo lần nộp mới nhất của từng ca viên.'}
              </Typography.Text>
            </Flex>
          )}
        </Spin>
      )}
    </Card>
  )
}
