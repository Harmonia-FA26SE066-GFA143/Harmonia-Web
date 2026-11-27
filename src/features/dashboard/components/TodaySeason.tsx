import { Button, Flex, Skeleton, Typography } from 'antd'
import { useLiturgicalDays } from '@/features/liturgical-programs'
import { vietnamToday } from '@/lib/api/dates'
import { SeasonRibbon } from '@/shared/ui'
import { colors, radius, spacing } from '@/styles/tokens'

/**
 * Today's liturgical season at the top of an overview: the view's one ribbon. Nothing while today is not synced; an
 * error says so with a retry.
 */
export function TodaySeason() {
  const today = vietnamToday()
  const days = useLiturgicalDays(today, today)
  const day = days.data?.get(today)

  if (days.isPending) {
    return (
      <div
        aria-hidden
        className="hm-skeleton-in"
        style={{
          minHeight: 88,
          padding: `${spacing.md}px ${spacing.lg}px`,
          background: colors.ivory,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.lg,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Skeleton active title={{ width: 200 }} paragraph={{ rows: 1, width: 280 }} />
      </div>
    )
  }
  if (days.isError) {
    return (
      <Flex align="center" gap={spacing.sm}>
        <Typography.Text type="danger">Không thể tải mùa phụng vụ hôm nay.</Typography.Text>
        <Button onClick={() => days.refetch()} loading={days.isFetching}>
          Thử lại
        </Button>
      </Flex>
    )
  }
  return day?.seasonName ? <SeasonRibbon seasonKey={day.seasonKey} color={day.color} seasonName={day.seasonName} celebrationName={day.celebrationName} /> : null
}
