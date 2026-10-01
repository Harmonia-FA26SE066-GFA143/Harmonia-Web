import { Flex, Progress, Table, Typography, type TableColumnsType } from 'antd'
import { colors, typography } from '@/styles/tokens'
import { describeAudience, formatDateTime } from '../practiceFormat'
import type { PracticeAssignment, PracticeSubmission } from '../types'

export interface AssignmentTableProps {
  assignments: PracticeAssignment[]
  submissions: PracticeSubmission[]
}

const muted = { color: colors.textMuted, fontSize: typography.metadata.fontSize }

/** Assignments of the program with their submission progress (FE-41, FE-46). */
export function AssignmentTable({ assignments, submissions }: AssignmentTableProps) {
  const columns: TableColumnsType<PracticeAssignment> = [
    {
      key: 'title',
      title: 'Bài tập',
      render: (_, item) => (
        <Flex vertical gap={2}>
          <Typography.Text strong>{item.title}</Typography.Text>
          {item.instructions && (
            <Typography.Text style={muted} ellipsis={{ tooltip: item.instructions }}>
              {item.instructions}
            </Typography.Text>
          )}
        </Flex>
      ),
    },
    { key: 'song', title: 'Bài hát', render: (_, item) => item.song.title },
    { key: 'audience', title: 'Đối tượng', render: (_, item) => describeAudience(item.audience) },
    {
      key: 'progress',
      title: 'Tiến độ nộp',
      width: 180,
      render: (_, item) => {
        const rows = submissions.filter((submission) => submission.assignmentId === item.id)
        const done = rows.filter((submission) => submission.submittedAt).length
        return (
          <Flex align="center" gap={8}>
            <Progress
              percent={rows.length ? Math.round((done / rows.length) * 100) : 0}
              showInfo={false}
              strokeColor={colors.primary}
              size="small"
              style={{ flex: 1, margin: 0 }}
              aria-label={`Tiến độ nộp ${item.title}`}
            />
            <Typography.Text style={{ fontFamily: typography.fontFamilyNumeric }}>
              {done}/{rows.length}
            </Typography.Text>
          </Flex>
        )
      },
    },
    {
      key: 'dueAt',
      title: 'Hạn nộp',
      width: 150,
      render: (_, item) => <Typography.Text style={{ fontFamily: typography.fontFamilyNumeric }}>{formatDateTime(item.dueAt)}</Typography.Text>,
    },
  ]

  return <Table<PracticeAssignment> rowKey="id" columns={columns} dataSource={assignments} pagination={false} scroll={{ x: 820 }} />
}
