import { Tag } from 'antd'
import { eventStatusLabels, type EventStatus } from '../types'

// Semantic colors keep Ant Design defaults; the label always carries the meaning.
const statusColors: Record<EventStatus, string> = {
  draft: 'default',
  published: 'green',
  cancelled: 'red',
}

export function EventStatusTag({ status }: { status: EventStatus }) {
  return (
    <Tag color={statusColors[status]} style={{ marginInlineEnd: 0 }}>
      {eventStatusLabels[status]}
    </Tag>
  )
}
