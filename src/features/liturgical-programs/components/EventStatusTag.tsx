import { StatusTag, type StatusTagColor } from '@/shared/ui'
import { eventStatusLabels, type EventStatus } from '../types'

// Preset tag colors; StatusTag darkens the text of the ones that are too pale to read.
const statusColors: Record<EventStatus, StatusTagColor> = {
  draft: 'default',
  published: 'green',
  cancelled: 'red',
}

export function EventStatusTag({ status }: { status: EventStatus }) {
  return (
    <StatusTag color={statusColors[status]} style={{ marginInlineEnd: 0 }}>
      {eventStatusLabels[status]}
    </StatusTag>
  )
}
