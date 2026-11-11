import { CheckOutlined } from '@ant-design/icons'
import { Button, Flex, Table, Typography, type TableColumnsType } from 'antd'
import { useRef } from 'react'
import { formatDateTime } from '@/lib/api/dates'
import { colors, spacing, typography } from '@/styles/tokens'
import { practiceStatusLabels, type PracticeSubmission } from '../types'
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
  /** The submission being marked "Đạt" from its row. */
  passingId?: string
  /** Submissions just marked "Đạt" from their rows: they show a ✓ until the queue reloads. */
  passedIds?: ReadonlySet<string>
  onPageChange: (page: number) => void
  onPass: (submission: PracticeSubmission) => void
  /** "Cần chỉnh sửa" opens the review with the moment being heard, in seconds, when the recording was played. */
  onNeedsRevision: (submission: PracticeSubmission, atSeconds?: number) => void
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
  passingId,
  passedIds,
  onPageChange,
  onPass,
  onNeedsRevision,
  onOpen,
  selectedId,
}: Readonly<SubmissionTableProps>) {
  const times = useRef(new Map<string, number>())

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
          <InlinePlayer submission={submission} onTime={(seconds) => times.current.set(submission.id, seconds)} />
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
      title: 'Chấm',
      align: 'right',
      render: (_, submission) =>
        passedIds?.has(submission.id) ? (
          // The button becomes its result (brief §12.9), announced to screen readers.
          <Flex justify="flex-end">
            <Typography.Text role="status" className="hm-pop" style={{ fontWeight: 600, color: colors.textPrimary, whiteSpace: 'nowrap' }}>
              <CheckOutlined aria-hidden style={{ color: colors.primary, marginInlineEnd: spacing.xs }} />
              Đã chấm {practiceStatusLabels.passed}
            </Typography.Text>
          </Flex>
        ) : submission.feedbacks.length === 0 ? (
          <Flex justify="flex-end" gap={spacing.sm}>
            <Button
              loading={passingId === submission.id}
              disabled={Boolean(passingId)}
              onClick={() => onPass(submission)}
              aria-label={`Chấm ${practiceStatusLabels.passed.toLowerCase()} bản thu của ${submission.memberName}`}
            >
              {practiceStatusLabels.passed}
            </Button>
            <Button
              disabled={Boolean(passingId)}
              onClick={() => onNeedsRevision(submission, times.current.get(submission.id))}
              aria-label={`${practiceStatusLabels.needsRevision} bản thu của ${submission.memberName}`}
            >
              {practiceStatusLabels.needsRevision}
            </Button>
          </Flex>
        ) : (
          <Button onClick={() => onOpen(submission)} aria-label={`Xem và nhận xét bản thu của ${submission.memberName}`}>
            Xem & nhận xét
          </Button>
        ),
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
      className="hm-table-pick"
      onRow={(submission) => ({ onClick: () => onOpen(submission) })}
    />
  )
}
