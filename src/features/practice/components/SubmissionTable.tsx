import { Button, Flex, Table, Typography, type TableColumnsType } from 'antd'
import { colors, typography } from '@/styles/tokens'
import { formatDateTime, formatDuration } from '../practiceFormat'
import type { PracticeSubmission } from '../types'
import { PracticeStatusTag } from './PracticeStatusTag'

export interface SubmissionTableProps {
  submissions: PracticeSubmission[]
  /** Server-side paging of GET /api/practice-submissions. */
  page: number
  pageSize: number
  total: number
  loading?: boolean
  onPageChange: (page: number) => void
  onOpen: (submission: PracticeSubmission) => void
}

const muted = { color: colors.textMuted, fontSize: typography.metadata.fontSize }
const numeric = { fontFamily: typography.fontFamilyNumeric }

/** The review queue: each member's newest attempt, oldest first, across every assignment (FE-42). */
export function SubmissionTable({ submissions, page, pageSize, total, loading, onPageChange, onOpen }: SubmissionTableProps) {
  const columns: TableColumnsType<PracticeSubmission> = [
    {
      key: 'member',
      title: 'Ca viên',
      dataIndex: 'memberName',
      render: (name: string) => <Typography.Text strong>{name}</Typography.Text>,
    },
    {
      key: 'assignment',
      title: 'Bài tập',
      render: (_, submission) => (
        <Flex vertical>
          <Typography.Text>{submission.assignmentTitle}</Typography.Text>
          <Typography.Text style={muted}>Hạn nộp {formatDateTime(submission.assignmentDueDate)}</Typography.Text>
        </Flex>
      ),
    },
    {
      key: 'submittedAt',
      title: 'Nộp lúc',
      render: (_, submission) => (
        <Flex vertical>
          <Typography.Text style={numeric}>{formatDateTime(submission.submittedAt)}</Typography.Text>
          <Typography.Text style={muted}>
            Lần {submission.attemptNo} · {formatDuration(submission.durationSeconds)}
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
      align: 'right',
      render: (_, submission) => (
        <Button
          type={submission.feedbacks.length === 0 ? 'primary' : 'default'}
          onClick={() => onOpen(submission)}
          aria-label={`${submission.feedbacks.length === 0 ? 'Nghe và chấm' : 'Xem và nhận xét'} bản thu của ${submission.memberName}`}
        >
          {submission.feedbacks.length === 0 ? 'Nghe & chấm' : 'Xem & nhận xét'}
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
    />
  )
}
