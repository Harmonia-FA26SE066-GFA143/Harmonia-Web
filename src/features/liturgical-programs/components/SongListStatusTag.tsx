import { Tag, Typography } from 'antd'
import { colors } from '@/styles/tokens'
import { songListStatusLabels, type SongListStatus } from '../types'

// Semantic colors keep Ant Design defaults; the label always carries the meaning.
const statusColors: Record<SongListStatus, string> = {
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
    <Tag color={statusColors[status]} style={{ marginInlineEnd: 0 }}>
      {songListStatusLabels[status]}
    </Tag>
  )
}
