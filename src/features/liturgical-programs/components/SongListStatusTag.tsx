import { Typography } from 'antd'
import { colors } from '@/styles/tokens'
import { StatusTag, type StatusTagColor } from '@/shared/ui'
import { songListStatusLabels, type SongListStatus } from '../types'

// Preset tag colors; StatusTag darkens the text of the ones that are too pale to read.
const statusColors: Record<SongListStatus, StatusTagColor> = {
  draft: 'default',
  submitted: 'gold',
  approved: 'green',
  rejected: 'red',
  needsRevision: 'orange',
}

/** Song-list condition of a program (conceptual label, see types.ts); "Chưa có" when none was submitted. */
export function SongListStatusTag({ status }: { status?: SongListStatus }) {
  if (!status) return <Typography.Text style={{ color: colors.textMuted }}>Chưa có</Typography.Text>
  return (
    <StatusTag color={statusColors[status]} style={{ marginInlineEnd: 0 }}>
      {songListStatusLabels[status]}
    </StatusTag>
  )
}
