import { CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, SolutionOutlined } from '@ant-design/icons'
import { Card, Progress, Table, Typography, type TableColumnsType } from 'antd'
import { useMemo, useState } from 'react'
import { attendanceLabels, useAttendances } from '@/features/attendance'
import { useRehearsalsBetween } from '@/features/rehearsals'
import { CardTitle, EmptyState, ErrorState, MetricSummary, SectionSkeleton } from '@/shared/ui'
import { spacing } from '@/styles/tokens'
import { aggregateAttendance, bucketNouns, type MemberAttendance, type Period } from '../directorReport'
import { StackedBars, type BarSeries } from './StackedBars'

const series: BarSeries<'present' | 'late' | 'excused' | 'absent'>[] = [
  { key: 'present', label: attendanceLabels.present, color: '#389e0d' },
  { key: 'late', label: attendanceLabels.late, color: '#d48806' },
  { key: 'excused', label: attendanceLabels.excused, color: '#0958d9' },
  { key: 'absent', label: attendanceLabels.absent, color: '#cf1322' },
]

const metrics = [
  { key: 'sessions', label: 'Buổi tập đã diễn ra', icon: CalendarOutlined },
  { key: 'rate', label: 'Chuyên cần (%)', icon: CheckCircleOutlined },
  { key: 'late', label: attendanceLabels.late, icon: ClockCircleOutlined },
  { key: 'excused', label: attendanceLabels.excused, icon: SolutionOutlined },
  { key: 'absent', label: attendanceLabels.absent, icon: CloseCircleOutlined },
]

const percent = (rate?: number) => (rate === undefined ? undefined : Math.round(rate * 100))

const columns: TableColumnsType<MemberAttendance> = [
  { key: 'name', title: 'Ca viên', dataIndex: 'fullName' },
  ...series.map(({ key, label }) => ({ key, title: label, dataIndex: key, align: 'right' as const, width: 120 })),
  {
    key: 'rate',
    title: 'Chuyên cần',
    width: 200,
    render: (_, member) =>
      member.rate === undefined ? (
        <Typography.Text type="secondary">Chưa điểm danh</Typography.Text>
      ) : (
        <Progress
          percent={percent(member.rate)}
          size="small"
          strokeColor={member.rate < 0.7 ? '#cf1322' : '#389e0d'}
          aria-label={`Chuyên cần của ${member.fullName}`}
        />
      ),
  },
]

/**
 * Attendance of the sessions held in the period, from `GET /api/rehearsals` and each session's
 * `GET /api/rehearsals/{id}/attendances` (the attendance report endpoint is Admin only).
 */
export function DirectorAttendanceReport({ period }: Readonly<{ period: Period }>) {
  const rehearsals = useRehearsalsBetween(period.from, period.to)
  // Read once: sessions starting while the page is open join on the next visit.
  const [now] = useState(Date.now)
  const held = useMemo(() => (rehearsals.data ?? []).filter(({ startAt }) => Date.parse(startAt) <= now), [rehearsals.data, now])
  const sheets = useAttendances(held.map(({ id }) => id))
  const pending = rehearsals.isPending || sheets.some((sheet) => sheet.isPending)
  const failed = rehearsals.isError || sheets.some((sheet) => sheet.isError)

  if (pending) return <SectionSkeleton rows={6} label="Đang tổng hợp điểm danh" />
  if (failed) {
    return (
      <ErrorState
        title="Không thể tải số liệu điểm danh"
        onRetry={() => {
          void rehearsals.refetch()
          for (const sheet of sheets) if (sheet.isError) void sheet.refetch()
        }}
        retrying={rehearsals.isFetching || sheets.some((sheet) => sheet.isFetching)}
      />
    )
  }
  if (held.length === 0) {
    return <EmptyState title="Chưa có buổi tập nào" description={`Không có buổi tập đã diễn ra trong ${period.name}.`} />
  }

  const report = aggregateAttendance(
    held.map((rehearsal, index) => ({ startAt: rehearsal.startAt, records: sheets[index].data ?? [] })),
    period,
    now,
  )

  return (
    <>
      <MetricSummary
        definitions={metrics}
        values={{ sessions: report.sessions, rate: percent(report.rate), ...report.totals }}
      />
      <Card title={<CardTitle>Điểm danh theo {bucketNouns[period.granularity]}</CardTitle>} style={{ marginBottom: spacing.lg }}>
        <StackedBars buckets={period.buckets} values={report.buckets} series={series} />
        {report.unmarked > 0 && (
          <Typography.Paragraph type="secondary" style={{ margin: `${spacing.md}px 0 0` }}>
            {report.unmarked} lượt chưa được điểm danh ở các buổi đã diễn ra, không tính vào tỷ lệ.
          </Typography.Paragraph>
        )}
      </Card>
      <Card title={<CardTitle>Theo ca viên</CardTitle>} styles={{ body: { padding: 0 } }}>
        <Table<MemberAttendance>
          rowKey="memberId"
          columns={columns}
          dataSource={report.members}
          pagination={{ pageSize: 20, hideOnSinglePage: true, showSizeChanger: false }}
          scroll={{ x: 760 }}
        />
      </Card>
    </>
  )
}
