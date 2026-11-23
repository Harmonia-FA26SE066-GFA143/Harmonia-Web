import { Card, Flex, Select, Table, Typography, type TableColumnsType } from 'antd'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { EmptyCell, EmptyState, ErrorState, PROGRAM_NOUN, SectionSkeleton, SELECT_POPUP_PROPS, StatusTag, UNKNOWN_METRIC_LABEL, type StatusTagColor } from '@/shared/ui'
import { colors, spacing, typography } from '@/styles/tokens'
import { usePreparationProgress, useUpcomingEvents } from '../hooks/usePractice'
import { formatEventOption } from '../practiceFormat'
import { participationStatusLabels, type MemberProgress, type ParticipationStatus } from '../types'

const muted = { color: colors.textMuted }

// Preset tag colors; StatusTag darkens the text of the ones that are too pale to read.
const participationColors: Record<ParticipationStatus, StatusTagColor> = {
  invited: 'default',
  confirmed: 'green',
  declined: 'red',
  unsure: 'gold',
}

const count = (part: number, whole: number) =>
  whole === 0 ? <EmptyCell text={UNKNOWN_METRIC_LABEL} /> :<span>{part}/{whole}</span>

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
        <StatusTag color={participationColors[status]} style={{ marginInlineEnd: 0 }}>
          {participationStatusLabels[status]}
        </StatusTag>
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
        <Typography.Text type="danger">
          {overdue}
        </Typography.Text>
      ) : (
        <span>0</span>
      ),
  },
]

/**
 * Three summary chips (`EventPreparationProgressDto`): a member never invited has no participation status, and one
 * with no assignment (`assignmentsTotal` 0) is not counted as having passed them all.
 */
function ProgressChips({ rows }: Readonly<{ rows: MemberProgress[] }>) {
  const invited = rows.filter((row) => row.participationStatus != null)
  const confirmed = invited.filter((row) => row.participationStatus === 'confirmed').length
  const assigned = rows.filter((row) => row.assignmentsTotal > 0)
  const allPassed = assigned.filter((row) => row.assignmentsPassed === row.assignmentsTotal).length
  const overdue = rows.filter((row) => row.assignmentsOverdue > 0).length
  return (
    <div className="hm-progress-chips" role="status" aria-label="Tóm tắt tiến độ chuẩn bị">
      <span>{invited.length > 0 ? `Đã xác nhận: ${confirmed}/${invited.length} đã mời` : 'Chưa gửi lời mời tham gia'}</span>
      <span>{assigned.length > 0 ? `Đạt đủ bài tập: ${allPassed}/${assigned.length} được giao` : 'Chưa giao bài tập'}</span>
      <span className={overdue > 0 ? 'is-warning' : undefined}>Quá hạn: {overdue} ca viên</span>
    </div>
  )
}

/**
 * Choir Director: each active member's readiness for an upcoming event (FE-46,
 * `GET /api/liturgical-events/{id}/preparation-progress`): participation answer, rehearsals attended out of those
 * held, assignments passed and overdue. Events are the upcoming published ones of the director's choirs.
 * Preselects event from `?programId=` or `?eventId=` when provided.
 */
export function ProgressTab() {
  const [params, setParams] = useSearchParams()
  const urlEventId = params.get('programId') ?? params.get('eventId') ?? undefined
  const events = useUpcomingEvents()
  const [userSelectedId, setUserSelectedId] = useState<string | null>(null)
  const eventId = userSelectedId ?? urlEventId
  const progress = usePreparationProgress(eventId)

  const handleSelectEvent = (id?: string) => {
    setUserSelectedId(id ?? '')
    const next = new URLSearchParams(params)
    if (id) {
      next.set('programId', id)
      next.delete('eventId')
    } else {
      next.delete('programId')
      next.delete('eventId')
    }
    setParams(next, { replace: true })
  }

  return (
    <Flex vertical gap={spacing.md}>
      <Flex wrap align="end" justify="space-between" gap={spacing.md}>
      <Flex vertical gap={4} style={{ flex: '1 1 320px', maxWidth: 480 }}>
      <label htmlFor="progress-event" style={{ fontSize: typography.metadata.fontSize, color: colors.textMuted }}>
        {PROGRAM_NOUN}
      </label>
      <Select
        {...SELECT_POPUP_PROPS}
        id="progress-event"
        showSearch
        optionFilterProp="label"
        placeholder="Chọn chương trình sắp tới"
        loading={events.isPending}
        value={eventId}
        onChange={handleSelectEvent}
        options={(events.data ?? []).map((event) => ({ value: event.id, label: formatEventOption(event) }))}
      />
      </Flex>
      {eventId && progress.data !== undefined && progress.data.length > 0 && <ProgressChips rows={progress.data} />}
      </Flex>
      {events.isError && (
        <ErrorState title="Không thể tải chương trình" error={events.error} hasData={events.data !== undefined} onRetry={() => events.refetch()} retrying={events.isFetching} />
      )}
      {events.data !== undefined && events.data.length === 0 && (
        <EmptyState title="Không có chương trình sắp tới" description="Tiến độ chuẩn bị được xem theo chương trình đã công bố." />
      )}
      {events.data !== undefined && events.data.length > 0 && !eventId && (
        <EmptyState title="Chọn một chương trình" description="Chọn chương trình để xem tiến độ chuẩn bị của từng ca viên." />
      )}
      {eventId && progress.isPending && <SectionSkeleton rows={6} label="Đang tải tiến độ" />}
      {progress.isError && (
        <ErrorState title="Không thể tải tiến độ" error={progress.error} hasData={progress.data !== undefined} onRetry={() => progress.refetch()} retrying={progress.isFetching} />
      )}
      {progress.data !== undefined && progress.data.length === 0 && (
        <EmptyState title="Chưa có ca viên đang sinh hoạt" description="Tiến độ hiện theo từng ca viên đang sinh hoạt." />
      )}
      {progress.data !== undefined && progress.data.length > 0 && (
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
