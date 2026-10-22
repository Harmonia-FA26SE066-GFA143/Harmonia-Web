import { CheckCircleOutlined, ExclamationCircleOutlined, HourglassOutlined, RedoOutlined, SoundOutlined } from '@ant-design/icons'
import { Card, Table, Typography, type TableColumnsType } from 'antd'
import type { ComponentType } from 'react'
import { practiceStatusLabels, useAllSubmissions } from '@/features/practice'
import { CardTitle, EmptyState, ErrorState, MetricSummary, SectionSkeleton } from '@/shared/ui'
import { spacing } from '@/styles/tokens'
import { aggregatePractice, bucketNouns, type MemberPractice, type Period } from '../directorReport'
import { StackedBars, type BarSeries } from './StackedBars'

const series: (BarSeries<'submitted' | 'passed' | 'needsRevision' | 'overdue'> & { icon: ComponentType })[] = [
  { key: 'passed', label: practiceStatusLabels.passed, color: '#389e0d', icon: CheckCircleOutlined },
  { key: 'submitted', label: practiceStatusLabels.submitted, color: '#0958d9', icon: HourglassOutlined },
  { key: 'needsRevision', label: practiceStatusLabels.needsRevision, color: '#d46b08', icon: RedoOutlined },
  { key: 'overdue', label: practiceStatusLabels.overdue, color: '#cf1322', icon: ExclamationCircleOutlined },
]

const metrics = [
  { key: 'total', label: 'Bài đã nộp', icon: SoundOutlined },
  ...series.map(({ key, label, icon }) => ({ key, label, icon })),
]

const columns: TableColumnsType<MemberPractice> = [
  { key: 'name', title: 'Ca viên', dataIndex: 'fullName' },
  { key: 'total', title: 'Bài đã nộp', dataIndex: 'total', align: 'right', width: 120 },
  ...series.map(({ key, label }) => ({ key, title: label, dataIndex: key, align: 'right' as const, width: 130 })),
]

/**
 * Practice submissions sent in the period, by their review status, from `GET /api/practice-submissions` (each
 * member's newest attempt per assignment; the assignment-completion report endpoint is Admin only).
 */
export function DirectorPracticeReport({ period }: Readonly<{ period: Period }>) {
  const submissions = useAllSubmissions()

  if (submissions.isPending) return <SectionSkeleton rows={6} label="Đang tổng hợp bài luyện tập" />
  if (submissions.isError) {
    return (
      <ErrorState title="Không thể tải bài luyện tập" onRetry={() => submissions.refetch()} retrying={submissions.isFetching} />
    )
  }

  const report = aggregatePractice(submissions.data, period)
  if (report.total === 0) {
    return <EmptyState title="Chưa có bài nộp" description={`Ca viên chưa nộp bài luyện tập nào trong ${period.name}.`} />
  }

  return (
    <>
      <MetricSummary definitions={metrics} values={{ total: report.total, ...report.totals }} />
      <Card title={<CardTitle>Bài nộp theo {bucketNouns[period.granularity]}</CardTitle>} style={{ marginBottom: spacing.lg }}>
        <StackedBars buckets={period.buckets} values={report.buckets} series={series} />
        <Typography.Paragraph type="secondary" style={{ margin: `${spacing.md}px 0 0` }}>
          Mỗi ca viên tính lần nộp mới nhất của từng bài, theo ngày nộp.
        </Typography.Paragraph>
      </Card>
      <Card title={<CardTitle>Theo ca viên</CardTitle>} styles={{ body: { padding: 0 } }}>
        <Table<MemberPractice>
          rowKey="fullName"
          columns={columns}
          dataSource={report.members}
          pagination={{ pageSize: 20, hideOnSinglePage: true, showSizeChanger: false }}
          scroll={{ x: 760 }}
        />
      </Card>
    </>
  )
}
