import { Tag } from 'antd'
import { practiceStatusLabels, type PracticeStatus } from '../types'

// Semantic colors keep Ant Design defaults (no approved values yet); the label always carries the meaning.
const statusColors: Record<PracticeStatus, string> = {
  submitted: 'blue',
  passed: 'green',
  needsRevision: 'orange',
  overdue: 'red',
}

export function PracticeStatusTag({ status }: { status: PracticeStatus }) {
  return (
    <Tag color={statusColors[status]} style={{ marginInlineEnd: 0 }}>
      {practiceStatusLabels[status]}
    </Tag>
  )
}
