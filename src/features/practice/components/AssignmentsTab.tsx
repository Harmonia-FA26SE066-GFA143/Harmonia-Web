import { ArrowLeftOutlined } from '@ant-design/icons'
import { Button, Card, Flex, Select, Table, Typography, type TableColumnsType } from 'antd'
import { useMemo, useState } from 'react'
import { EmptyState, ErrorState, NoFilterResults, SectionSkeleton } from '@/shared/ui'
import { colors, spacing, typography } from '@/styles/tokens'
import { useAssignments, useUpcomingEvents } from '../hooks/usePractice'
import { formatDateTime, formatEventOption } from '../practiceFormat'
import type { PracticeAssignment } from '../types'
import { SubmissionList } from './SubmissionList'

const pageSize = 20
const muted = { color: colors.textMuted, fontSize: typography.metadata.fontSize }

const targetText = ({ scope, skillIds, memberIds }: PracticeAssignment) =>
  ({ all: 'Cả ca đoàn', skillGroup: `${skillIds.length} kỹ năng`, individual: `${memberIds.length} ca viên` })[scope]

/** The submissions of one assignment, reviewed like the queue. */
function AssignmentSubmissions({ assignment, onBack }: Readonly<{ assignment: PracticeAssignment; onBack: () => void }>) {
  return (
    <Flex vertical gap={spacing.md}>
      <Flex wrap gap={spacing.sm} align="center">
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
          Về danh sách bài đã giao
        </Button>
        <Flex vertical>
          <Typography.Text strong>{assignment.title}</Typography.Text>
          <Typography.Text style={muted}>Hạn nộp {formatDateTime(assignment.dueDate)} · {targetText(assignment)}</Typography.Text>
        </Flex>
      </Flex>
      <SubmissionList assignmentId={assignment.id} defaultStatus="all" />
    </Flex>
  )
}

/** Assignments the Choir Director gave (FE-41, B21), latest due date first, with their submissions. */
export function AssignmentsTab() {
  const [eventId, setEventId] = useState<string>()
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState<PracticeAssignment>()
  const assignments = useAssignments(eventId, { pageNumber: page, pageSize })
  const events = useUpcomingEvents()
  const eventsById = useMemo(() => new Map((events.data ?? []).map((event) => [event.id, event])), [events.data])
  const total = assignments.data?.totalCount ?? 0

  if (open) return <AssignmentSubmissions assignment={open} onBack={() => setOpen(undefined)} />

  const columns: TableColumnsType<PracticeAssignment> = [
    {
      key: 'title',
      title: 'Bài tập',
      render: (_, assignment) => (
        <Flex vertical gap={2}>
          <Typography.Text strong>{assignment.title}</Typography.Text>
          {assignment.instruction && (
            <Typography.Text style={muted} ellipsis={{ tooltip: assignment.instruction }}>
              {assignment.instruction}
            </Typography.Text>
          )}
        </Flex>
      ),
    },
    {
      key: 'due',
      title: 'Hạn nộp',
      render: (_, assignment) => (
        <Typography.Text style={{ fontFamily: typography.fontFamilyNumeric, whiteSpace: 'nowrap' }}>
          {formatDateTime(assignment.dueDate)}
        </Typography.Text>
      ),
    },
    { key: 'target', title: 'Giao cho', render: (_, assignment) => targetText(assignment) },
    {
      key: 'event',
      title: 'Chương trình',
      render: (_, assignment) => {
        if (!assignment.eventId) return <Typography.Text style={{ color: colors.textMuted }}>—</Typography.Text>
        const event = eventsById.get(assignment.eventId)
        // The Choir Director can name upcoming events only (GET /api/schedule/events).
        return event ? formatEventOption(event) : <Typography.Text style={{ color: colors.textMuted }}>Chương trình đã qua</Typography.Text>
      },
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'right',
      render: (_, assignment) => (
        <Button onClick={() => setOpen(assignment)} aria-label={`Xem bản thu của ${assignment.title}`}>
          Xem bản thu
        </Button>
      ),
    },
  ]

  return (
    <Flex vertical gap={spacing.md}>
      <Select
        allowClear
        showSearch
        optionFilterProp="label"
        aria-label="Lọc theo chương trình"
        placeholder="Tất cả chương trình"
        value={eventId}
        onChange={(value?: string) => {
          setEventId(value)
          setPage(1)
        }}
        loading={events.isPending}
        options={(events.data ?? []).map((event) => ({ value: event.id, label: formatEventOption(event) }))}
        style={{ maxWidth: 420 }}
      />
      {assignments.isPending && <SectionSkeleton rows={6} label="Đang tải bài đã giao" />}
      {assignments.isError && (
        <ErrorState title="Không thể tải bài đã giao" onRetry={() => assignments.refetch()} retrying={assignments.isFetching} />
      )}
      {assignments.isSuccess && total === 0 &&
        (eventId ? (
          <NoFilterResults onClearFilters={() => setEventId(undefined)} />
        ) : (
          <EmptyState title="Chưa giao bài tập nào" description="Giao bài ở tab “Giao bài”; bài đã giao sẽ xuất hiện tại đây." />
        ))}
      {assignments.isSuccess && total > 0 && (
        <Card styles={{ body: { padding: 0 } }}>
          <Table<PracticeAssignment>
            rowKey="id"
            columns={columns}
            dataSource={assignments.data.items}
            loading={assignments.isPlaceholderData}
            pagination={{ current: page, pageSize, total, hideOnSinglePage: true, showSizeChanger: false, onChange: setPage }}
            scroll={{ x: 820 }}
          />
        </Card>
      )}
    </Flex>
  )
}
