import { Button, Flex, Typography } from 'antd'
import dayjs from 'dayjs'
import { useLiturgicalDays } from '@/features/liturgical-programs'
import { SeasonRibbon } from '@/shared/ui'
import { spacing } from '@/styles/tokens'

/**
 * Today's liturgical season at the top of an overview: the view's one ribbon. Nothing while today is not synced; an
 * error says so with a retry.
 */
export function TodaySeason() {
  const today = dayjs().format('YYYY-MM-DD')
  const days = useLiturgicalDays(today, today)
  const day = days.data?.get(today)

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
