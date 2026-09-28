import { Flex, Tag, Typography } from 'antd'
import { colors, typography } from '@/styles/tokens'
import { songReviewDecisionLabels, type SongReview } from '../types'

/** The Priest's decision on one song, with its note. Shared by the proposal and review pages. */
export function SongReviewNote({ review }: { review?: SongReview }) {
  // No per-song decision: not reviewed yet, added after the last review, or the whole list was rejected.
  if (!review) return <Typography.Text style={{ color: colors.textMuted }}>—</Typography.Text>
  return (
    <Flex vertical gap={2} align="flex-start">
      <Tag color={review.decision === 'accepted' ? 'green' : 'orange'} style={{ marginInlineEnd: 0 }}>
        {songReviewDecisionLabels[review.decision]}
      </Tag>
      {review.note && (
        <Typography.Text style={{ fontSize: typography.metadata.fontSize, color: colors.textBody }}>
          {review.note}
        </Typography.Text>
      )}
    </Flex>
  )
}
