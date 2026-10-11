import { StatusTag, type StatusTagColor } from '@/shared/ui'
import { practiceStatusLabels, type PracticeStatus } from '../types'

// Preset tag colors; StatusTag darkens the text of the ones that are too pale to read.
const statusColors: Record<PracticeStatus, StatusTagColor> = {
  submitted: 'blue',
  passed: 'green',
  needsRevision: 'orange',
  overdue: 'red',
}

export function PracticeStatusTag({ status }: { status: PracticeStatus }) {
  return (
    <StatusTag color={statusColors[status]} style={{ marginInlineEnd: 0 }}>
      {practiceStatusLabels[status]}
    </StatusTag>
  )
}
