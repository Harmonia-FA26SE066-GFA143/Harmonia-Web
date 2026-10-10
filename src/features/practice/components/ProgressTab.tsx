import { Card, Flex, Select, Table, Tag, Typography, type TableColumnsType } from 'antd'
import { useState } from 'react'
import { EmptyState, ErrorState, SectionSkeleton } from '@/shared/ui'
import { colors, spacing, typography } from '@/styles/tokens'
import { usePreparationProgress, useUpcomingEvents } from '../hooks/usePractice'
import { formatEventOption } from '../practiceFormat'
import { participationStatusLabels, type MemberProgress, type ParticipationStatus } from '../types'

const muted = { color: colors.textMuted }
const numeric = { fontFamily: typography.fontFamilyNumeric }

// Semantic colors keep Ant Design defaults; the label always carries the meaning.
const participationColors: Record<ParticipationStatus, string> = {
  invited: 'default',
  confirmed: 'green',
  declined: 'red',
  unsure: 'gold',
}

const count = (part: number, whole: number) =>
  whole === 0 ? <Typography.Text style={muted}>—</Typography.Text> : <span style={numeric}>{part}/{whole}</span>

const columns: TableColumnsType<MemberProgress> = [
  {
    key: 'member',
    title: 'Ca viên',
    dataIndex: 'fullName',
    render: (fullName: string) => <Typography.Text strong>{fullName || 'Chưa có họ tên'}</Typography.Text>,
  },
  {
    key: 'participation',
    title: 'Xác nhận tham gia',
    dataIndex: 'participationStatus',
    render: (status?: ParticipationStatus) =>
      status ? (
        <Tag color={participationColors[status]} style={{ marginInlineEnd: 0 }}>
          {participationStatusLabels[status]}
        </Tag>
      ) : (
        <Typography.Text style={muted}>Chưa gửi</Typography.Text>
      ),
  },
  { key: 'rehearsals', title: 'Buổi tập đã dự', render: (_, row) => count(row.rehearsalsAttended, row.rehearsalsHeld) },
  { key: 'passed', title: 'Bài tập đạt', render: (_, row) => count(row.assignmentsPassed, row.assignmentsTotal) },
  {
    key: 'overdue',
    title: 'Quá hạn',
    dataIndex: 'assignmentsOverdue',
    render: (overdue: number) =>
      overdue > 0 ? (
        <Typography.Text type="danger" style={numeric}>
          {overdue}
        </Typography.Text>
      ) : (
        <span style={numeric}>0</span>
      ),
  },
]

/**
 * Choir Director: each active member's readiness for an upcoming event (FE-46,
 * `GET /api/liturgical-events/{id}/preparation-progress`): participation answer, rehearsals attended out of those
 * held, assignments passed and overdue. Events come from `GET /api/schedule/events`, the upcoming published ones.
 */
export function ProgressTab() {
  const events = useUpcomingEvents()
  const [eventId, setEventId] = useState<string>()
  const progress = usePreparationProgress(eventId)

  return (
    <Flex vertical gap={spacing.md}>
      <Select
        aria-label="Sự kiện"
        showSearch
        optionFilterProp="label"
        placeholder="Chọn sự kiện sắp tới"
        loading={events.isPending}
        value={eventId}
        onChange={setEventId}
        options={(events.data ?? []).map((event) => ({ value: event.id, label: formatEventOption(event) }))}
        style={{ width: '100%', maxWidth: 480 }}
      />
      {events.isError && (
        <ErrorState title="Không thể tải sự kiện" onRetry={() => events.refetch()} retrying={events.isFetching} />
      )}
      {events.isSuccess && events.data.length === 0 && (
        <EmptyState title="Không có sự kiện sắp tới" description="Tiến độ chuẩn bị được xem theo sự kiện đã công bố." />
      )}
      {events.isSuccess && events.data.length > 0 && !eventId && (
        <EmptyState title="Chọn một sự kiện" description="Chọn sự kiện để xem tiến độ chuẩn bị của từng ca viên." />
      )}
      {eventId && progress.isPending && <SectionSkeleton rows={6} label="Đang tải tiến độ" />}
      {progress.isError && (
        <ErrorState title="Không thể tải tiến độ" onRetry={() => progress.refetch()} retrying={progress.isFetching} />
      )}
      {progress.isSuccess && progress.data.length === 0 && (
        <EmptyState title="Chưa có ca viên đang sinh hoạt" description="Tiến độ hiện theo từng ca viên đang sinh hoạt." />
      )}
      {progress.isSuccess && progress.data.length > 0 && (
        <Card styles={{ body: { padding: 0 } }}>
          <Table<MemberProgress>
            rowKey="memberId"
            columns={columns}
            dataSource={progress.data}
            pagination={false}
            scroll={{ x: 'max-content' }}
          />
        </Card>
      )}
    </Flex>
  )
}
