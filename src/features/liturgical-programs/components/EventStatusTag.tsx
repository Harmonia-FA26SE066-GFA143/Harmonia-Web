import { StatusTag, type StatusTagColor } from '@/shared/ui'
import { eventStatusLabels, type EventStatus } from '../types'

// Preset tag colors; StatusTag darkens the text of the ones that are too pale to read.
const statusColors: Record<EventStatus, StatusTagColor> = {
  draft: 'default',
  published: 'green',
  cancelled: 'red',
}

export function EventStatusTag({ status }: Readonly<{ status: EventStatus }>) {
  return (
    <StatusTag
      color={statusColors[status]}
      mark={status === 'draft' ? 'draft' : status === 'cancelled' ? 'struck' : undefined}
      style={{ marginInlineEnd: 0 }}
    >
      {eventStatusLabels[status]}
    </StatusTag>
  )
}
