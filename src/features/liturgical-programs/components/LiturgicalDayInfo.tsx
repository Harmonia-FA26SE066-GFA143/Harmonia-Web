import { SyncOutlined } from '@ant-design/icons'
import type { UseQueryResult } from '@tanstack/react-query'
import { App, Button, Flex, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import { SeasonChip } from '@/shared/ui'
import { colors, spacing } from '@/styles/tokens'
import { calendarErrorMessage } from '../calendarErrors'
import { useSyncLiturgicalDays } from '../hooks/useLiturgicalDays'
import type { LiturgicalDay } from '../types'

const muted = { color: colors.textMuted }

/**
 * The liturgical day of `date` (YYYY-MM-DD) from the days loaded for its month: celebration, rank and season, or a
 * hint to sync the year.
 */
export function LiturgicalDayInfo({ date, days }: Readonly<{ date: string; days: UseQueryResult<Map<string, LiturgicalDay>> }>) {
  if (days.isPending) return <Typography.Text style={muted}>Đang tải ngày phụng vụ…</Typography.Text>
  if (days.isError) {
    return (
      <Flex align="center" gap={spacing.xs} wrap>
        <Typography.Text type="danger">Không thể tải ngày phụng vụ.</Typography.Text>
        <Button type="link" size="small" onClick={() => days.refetch()} loading={days.isFetching}>
          Thử lại
        </Button>
      </Flex>
    )
  }
  const day = days.data.get(date)
  if (!day) {
    return <Typography.Text style={muted}>Chưa có ngày phụng vụ cho ngày này. Đồng bộ lịch phụng vụ của năm để hiển thị.</Typography.Text>
  }

  const { celebrationName, rank, seasonKey, color, seasonName } = day
  return (
    <Flex align="center" gap={spacing.xs} wrap>
      <Typography.Text strong>{celebrationName}</Typography.Text>
      {rank && <Tag style={{ marginInlineEnd: 0 }}>{rank}</Tag>}
      {seasonName && <SeasonChip seasonKey={seasonKey} color={color} seasonName={seasonName} />}
    </Flex>
  )
}

/**
 * Parish Priest: syncs a civil year from the Liturgical Calendar API (Harmonia-BE LiturgicalDayService.SyncAsync). The
 * backend overwrites the days already cached for that year, so it asks first. The backend translates the names when
 * they are read, so a translation the Admin edits shows without syncing again.
 */
export function SyncCalendarButton({ year }: Readonly<{ year: number }>) {
  const { message, modal } = App.useApp()
  const sync = useSyncLiturgicalDays()

  const confirm = () =>
    modal.confirm({
      title: `Đồng bộ lịch phụng vụ năm ${year}?`,
      content: `Harmonia lấy lịch phụng vụ năm ${year} từ nguồn lịch trực tuyến và ghi đè các ngày phụng vụ đã có của năm này.`,
      okText: 'Đồng bộ',
      cancelText: 'Hủy',
      onOk: () =>
        sync
          .mutateAsync(year)
          .then(({ syncedCount, affectedEvents }) => {
            message.success(`Đã đồng bộ ${syncedCount} ngày phụng vụ năm ${year}.`)
            if (!affectedEvents.length) return
            // Upcoming events on a day that now has another celebration: the priest checks their readings and songs.
            modal.info({
              title: `${affectedEvents.length} chương trình sắp tới đổi ngày lễ`,
              content: (
                <ul style={{ paddingInlineStart: spacing.md, margin: 0 }}>
                  {affectedEvents.map((event) => (
                    <li key={event.eventId}>
                      <Typography.Text strong>{event.title || 'Chương trình'}</Typography.Text>{' '}
                      {dayjs(event.eventDate).format('DD/MM/YYYY')} {event.time.slice(0, 5)}:{' '}
                      {event.previousCelebrationName ?? 'chưa có tên lễ'} → {event.celebrationName ?? 'chưa có tên lễ'}
                    </li>
                  ))}
                </ul>
              ),
              okText: 'Đã hiểu',
            })
          })
          .catch((error: Error) => message.error(calendarErrorMessage(error, 'Không thể đồng bộ lịch phụng vụ. Vui lòng thử lại.'))),
    })

  return (
    <Button icon={<SyncOutlined />} loading={sync.isPending} onClick={confirm}>
      Đồng bộ lịch phụng vụ {year}
    </Button>
  )
}
