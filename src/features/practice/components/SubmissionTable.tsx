import { Button, Flex, Table, Typography, type TableColumnsType } from 'antd'
import { SkillTags } from '@/features/members'
import { colors, typography } from '@/styles/tokens'
import { formatDateTime, formatDuration } from '../practiceFormat'
import type { PracticeAssignment, PracticeSubmission } from '../types'
import { PracticeStatusTag } from './PracticeStatusTag'

export interface SubmissionTableProps {
  submissions: PracticeSubmission[]
  assignments: Map<string, PracticeAssignment>
  onReview: (submission: PracticeSubmission) => void
}

const muted = { color: colors.textMuted, fontSize: typography.metadata.fontSize }

/** Members of each assignment with their latest submission and review (FE-12, FE-42–FE-44). */
export function SubmissionTable({ submissions, assignments, onReview }: SubmissionTableProps) {
  const columns: TableColumnsType<PracticeSubmission> = [
    {
      key: 'member',
      title: 'Ca viên',
      render: (_, item) => (
        <Flex vertical gap={4}>
          <Typography.Text strong>{item.fullName}</Typography.Text>
          <SkillTags skills={item.skills} />
        </Flex>
      ),
    },
    {
      key: 'assignment',
      title: 'Bài tập',
      render: (_, item) => {
        const assignment = assignments.get(item.assignmentId)
        return (
          <Flex vertical gap={2}>
            <Typography.Text>{assignment?.title ?? '—'}</Typography.Text>
            {assignment && <Typography.Text style={muted}>{assignment.song.title}</Typography.Text>}
          </Flex>
        )
      },
    },
    {
      key: 'submittedAt',
      title: 'Nộp lúc',
      width: 150,
      render: (_, item) => (
        <Flex vertical gap={2}>
          <Typography.Text style={{ fontFamily: typography.fontFamilyNumeric }}>{formatDateTime(item.submittedAt)}</Typography.Text>
          {item.submittedAt && <Typography.Text style={muted}>Thời lượng {formatDuration(item.durationSeconds)}</Typography.Text>}
        </Flex>
      ),
    },
    { key: 'status', title: 'Trạng thái', width: 130, render: (_, item) => <PracticeStatusTag status={item.status} /> },
    {
      key: 'feedback',
      title: 'Nhận xét gần nhất',
      render: (_, item) =>
        item.reviews[0]?.feedback ? (
          <Typography.Text ellipsis={{ tooltip: item.reviews[0].feedback }} style={{ maxWidth: 260 }}>
            {item.reviews[0].feedback}
          </Typography.Text>
        ) : (
          <Typography.Text style={{ color: colors.textMuted }}>—</Typography.Text>
        ),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'right',
      width: 130,
      render: (_, item) =>
        // Only a submission can be reviewed; members who have not submitted have nothing to listen to.
        item.submittedAt ? (
          <Button type="link" onClick={() => onReview(item)} aria-label={`Đánh giá bài nộp của ${item.fullName}`}>
            {item.reviews[0]?.submittedAt === item.submittedAt ? 'Sửa đánh giá' : 'Đánh giá'}
          </Button>
        ) : null,
    },
  ]

  return <Table<PracticeSubmission> rowKey="id" columns={columns} dataSource={submissions} pagination={false} scroll={{ x: 960 }} />
}
