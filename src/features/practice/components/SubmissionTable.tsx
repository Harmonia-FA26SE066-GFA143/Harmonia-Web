import { Button, Flex, Table, Typography, type TableColumnsType } from 'antd'
import { formatDateTime } from '@/lib/api/dates'
import { colors, spacing, typography } from '@/styles/tokens'
import type { PracticeSubmission } from '../types'
import { InlinePlayer } from './InlinePlayer'
import { PracticeStatusTag } from './PracticeStatusTag'

export interface SubmissionTableProps {
  submissions: PracticeSubmission[]
  /** The row shown in the review panel beside the table. */
  selectedId?: string
  /** Server-side paging of GET /api/practice-submissions. */
  page: number
  pageSize: number
  total: number
  loading?: boolean
  onPageChange: (page: number) => void
  onOpen: (submission: PracticeSubmission) => void
}

const muted = { color: colors.textMuted, fontSize: typography.metadata.fontSize }

/**
 * The review queue: each member's newest attempt, oldest first, across every assignment (FE-42). Audio first (brief
 * §12.8): the recording plays in its row, and a first review is one click, "Đạt", or "Cần chỉnh sửa" with a comment.
 */
export function SubmissionTable({
  submissions,
  page,
  pageSize,
  total,
  loading,
  onPageChange,
  onOpen,
  selectedId,
}: Readonly<SubmissionTableProps>) {
  const columns: TableColumnsType<PracticeSubmission> = [
    {
      key: 'member',
      title: 'Ca viên',
      render: (_, submission) => (
        <Flex vertical>
          <Typography.Text strong>{submission.memberName}</Typography.Text>
          <Typography.Text style={muted}>
            {submission.assignmentTitle} · hạn {formatDateTime(submission.assignmentDueDate)}
          </Typography.Text>
        </Flex>
      ),
    },
    {
      key: 'recording',
      title: 'Bản thu',
      render: (_, submission) => (
        <Flex vertical gap={spacing.xs}>
          <InlinePlayer submission={submission} />
          <Typography.Text style={muted}>
            Lần {submission.attemptNo} · nộp {formatDateTime(submission.submittedAt)}
          </Typography.Text>
        </Flex>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (status: PracticeSubmission['status']) => <PracticeStatusTag status={status} />,
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'center',
      width: 132,
      render: (_, submission) => {
        const open = submission.id === selectedId
        const reviewed = submission.feedbacks.length > 0
        // The open row says so in words, not only by its tint.
        let label = reviewed ? 'Xem nhận xét' : 'Chấm bài'
        if (open) label = reviewed ? 'Đang xem' : 'Đang chấm'
        return (
          <Button
            type={open ? 'primary' : 'default'}
            ghost={open}
            onClick={() => onOpen(submission)}
            aria-current={open ? 'true' : undefined}
            aria-label={`${reviewed ? 'Xem nhận xét' : 'Chấm bài'} của ${submission.memberName}`}
          >
            {label}
          </Button>
        )
      },
    },
  ]

  return (
    <Table<PracticeSubmission>
      rowKey="id"
      columns={columns}
      dataSource={submissions}
      loading={loading}
      pagination={{ current: page, pageSize, total, hideOnSinglePage: true, showSizeChanger: false, onChange: onPageChange }}
      scroll={{ x: 'max-content' }}
      rowClassName={(submission) => (submission.id === selectedId ? 'is-picked' : '')}
      className="hm-table-pick hm-review-queue"
    />
  )
}
