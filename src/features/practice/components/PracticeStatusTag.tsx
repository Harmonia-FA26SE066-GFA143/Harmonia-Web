import { Tag } from 'antd'
import { practiceStatusLabels, type PracticeStatus } from '../types'

const statusColors: Record<PracticeStatus, string> = {
  submitted: 'blue',
  passed: 'green',
  needsRevision: 'orange',
  overdue: 'red',
}

/** FE-12 status as a tag; members who have not submitted show "Chưa nộp" (a state, not a status value). */
export function PracticeStatusTag({ status }: { status?: PracticeStatus }) {
  return status ? (
    <Tag color={statusColors[status]} style={{ marginInlineEnd: 0 }}>
      {practiceStatusLabels[status]}
    </Tag>
  ) : (
    <Tag style={{ marginInlineEnd: 0 }}>Chưa nộp</Tag>
  )
}
