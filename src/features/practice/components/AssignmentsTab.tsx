import { Alert, App, Button, Card, Flex, Select, Table, Typography, type TableColumnsType } from 'antd'
import { useMemo, useState } from 'react'
import { useLocation } from 'react-router'
import {
  EmptyCell,
  EmptyState,
  ErrorState,
  filterAllPlaceholder,
  Icon,
  NoFilterResults,
  PROGRAM_NOUN_SHORT,
  SectionSkeleton,
  SELECT_POPUP_PROPS,
  ViewDrawer,
} from '@/shared/ui'
import { colors, component, spacing, typography } from '@/styles/tokens'
import { useAssignments, useDeleteAssignment, useUpcomingEvents } from '../hooks/usePractice'
import { practiceErrorMessage } from '../practiceErrors'
import { AssignmentEditDrawer } from './AssignmentEditDrawer'
import { formatDateTime } from '@/lib/api/dates'
import { formatEventOption } from '../practiceFormat'
import type { PracticeAssignment } from '../types'
import { SubmissionList } from './SubmissionList'

const pageSize = 20
const muted = { color: colors.textMuted, fontSize: typography.metadata.fontSize }

const targetText = ({ scope, skillIds, memberIds }: PracticeAssignment) =>
  ({ all: 'Cả ca đoàn', skillGroup: `${skillIds.length} kỹ năng`, individual: `${memberIds.length} ca viên` })[scope]

/** The submissions of one assignment, reviewed like the queue. */
function AssignmentSubmissions({ assignment }: Readonly<{ assignment: PracticeAssignment }>) {
  return (
    <Flex vertical gap={spacing.md}>
      <Flex vertical>
        <Typography.Text strong>{assignment.title}</Typography.Text>
        <Typography.Text style={muted}>Hạn nộp {formatDateTime(assignment.dueDate)} · {targetText(assignment)}</Typography.Text>
      </Flex>
      <SubmissionList assignmentId={assignment.id} defaultStatus="all" />
    </Flex>
  )
}

/** Assignments the Choir Director gave (FE-41, B21), latest due date first, with their submissions. */
export function AssignmentsTab() {
  const location = useLocation()
  const createdTitle = (location.state as { createdTitle?: string } | null)?.createdTitle
  const [eventId, setEventId] = useState<string>()
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState<PracticeAssignment>()
  const [editing, setEditing] = useState<PracticeAssignment>()
  const { message, modal } = App.useApp()
  const remove = useDeleteAssignment()

  // Withdrawn only while nobody has submitted (PRACTICE_ASSIGNMENT_HAS_SUBMISSIONS): a recording is never lost.
  const confirmDelete = (assignment: PracticeAssignment) =>
    modal.confirm({
      title: `Thu hồi bài tập “${assignment.title}”?`,
      content: 'Ca viên sẽ không còn thấy bài tập này. Bài tập đã có người nộp thì không thu hồi được.',
      okText: 'Thu hồi bài tập',
      okButtonProps: { danger: true },
      cancelText: 'Giữ lại',
      onOk: () =>
        remove.mutateAsync(assignment.id).then(
          () => {
            message.success('Đã thu hồi bài tập.')
            setOpen(undefined)
          },
          (error: Error) => {
            message.error(practiceErrorMessage(error, 'Không thể thu hồi bài tập. Vui lòng thử lại.'))
          },
        ),
    })
  const assignments = useAssignments(eventId, { pageNumber: page, pageSize })
  const events = useUpcomingEvents()
  const eventsById = useMemo(() => new Map((events.data ?? []).map((event) => [event.id, event])), [events.data])
  const total = assignments.data?.totalCount ?? 0

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
        <Typography.Text style={{ whiteSpace: 'nowrap' }}>
          {formatDateTime(assignment.dueDate)}
        </Typography.Text>
      ),
    },
    { key: 'target', title: 'Giao cho', render: (_, assignment) => targetText(assignment) },
    {
      key: 'event',
      title: 'Chương trình',
      render: (_, assignment) => {
        if (!assignment.eventId) return <EmptyCell text="Không gắn chương trình" />
        const event = eventsById.get(assignment.eventId)
        // Only upcoming events are listed, so an assignment of a past event shows without its name.
        return event ? formatEventOption(event) : <Typography.Text style={{ color: colors.textMuted }}>Chương trình đã qua</Typography.Text>
      },
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'center',
      width: 128,
      render: (_, assignment) => (
        <Button onClick={() => setOpen(assignment)} aria-label={`Xem chi tiết ${assignment.title}`}>
          Xem chi tiết
        </Button>
      ),
    },
  ]

  return (
    <Flex vertical gap={spacing.md}>
      {createdTitle && (
        <Alert
          type="success"
          showIcon
          title={`Đã giao bài tập “${createdTitle}”`}
          description="Bài tập mới được làm nổi bật trong danh sách; ca viên đã nhận được thông báo."
        />
      )}
      <Flex vertical gap={4} style={{ maxWidth: 420 }}>
      <label htmlFor="assignment-filter-event" style={muted}>
        {PROGRAM_NOUN_SHORT}
      </label>
      <Select
        {...SELECT_POPUP_PROPS}
        id="assignment-filter-event"
        allowClear
        showSearch
        optionFilterProp="label"
        placeholder={filterAllPlaceholder('chương trình')}
        value={eventId}
        onChange={(value?: string) => {
          setEventId(value)
          setPage(1)
        }}
        loading={events.isPending}
        options={(events.data ?? []).map((event) => ({ value: event.id, label: formatEventOption(event) }))}
      />
      </Flex>
      {assignments.isPending && <SectionSkeleton rows={6} label="Đang tải bài đã giao" />}
      {assignments.isError && (
        <ErrorState title="Không thể tải bài đã giao" error={assignments.error} hasData={assignments.data !== undefined} onRetry={() => assignments.refetch()} retrying={assignments.isFetching} />
      )}
      {assignments.data !== undefined && total === 0 &&
        (eventId ? (
          <NoFilterResults onClearFilters={() => setEventId(undefined)} />
        ) : (
          <EmptyState title="Chưa giao bài tập nào" description="Dùng nút “Giao bài tập”; bài đã giao sẽ xuất hiện tại đây." />
        ))}
      {assignments.data !== undefined && total > 0 && (
        <Card styles={{ body: { padding: 0 } }}>
          <Table<PracticeAssignment>
            rowKey="id"
            columns={columns}
            dataSource={assignments.data.items}
            loading={assignments.isPlaceholderData}
            pagination={{ current: page, pageSize, total, hideOnSinglePage: true, showSizeChanger: false, onChange: setPage }}
            scroll={{ x: 820 }}
            rowClassName={(assignment) => (createdTitle && assignment.title === createdTitle ? 'is-picked' : '')}
          />
        </Card>
      )}
      {/* Edit and withdraw since BE B59 (PUT / DELETE api/practice-assignments/{id}). */}
      <ViewDrawer
        open={Boolean(open)}
        title="Chi tiết bài tập"
        size={component.drawer.lg}
        onClose={() => setOpen(undefined)}
        destroyOnHidden
        extra={
          open && (
            <Flex gap={spacing.sm}>
              <Button icon={<Icon name="edit" />} onClick={() => setEditing(open)}>
                Sửa
              </Button>
              <Button danger icon={<Icon name="delete" />} onClick={() => confirmDelete(open)}>
                Thu hồi
              </Button>
            </Flex>
          )
        }
      >
        {open && <AssignmentSubmissions assignment={open} />}
      </ViewDrawer>
      <AssignmentEditDrawer
        assignment={editing}
        onClose={() => {
          setEditing(undefined)
          setOpen(undefined)
        }}
      />
    </Flex>
  )
}
