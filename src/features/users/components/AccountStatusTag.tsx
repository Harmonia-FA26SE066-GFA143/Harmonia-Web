import { StatusTag } from '@/shared/ui'
import { accountStatusLabels } from '../types'

// Preset tag colors; StatusTag darkens the text of the ones that are too pale to read.
export function AccountStatusTag({ isActive }: { isActive: boolean }) {
  return (
    <StatusTag color={isActive ? 'green' : 'default'} style={{ marginInlineEnd: 0 }}>
      {isActive ? accountStatusLabels.active : accountStatusLabels.inactive}
    </StatusTag>
  )
}
