import type { UseQueryResult } from '@tanstack/react-query'
import { App, Button, Flex, Typography } from 'antd'
import dayjs from 'dayjs'
import { generatePath, useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { CANCEL_LABEL, Icon, SeasonChip } from '@/shared/ui'
import { colors, spacing } from '@/styles/tokens'
import { calendarErrorMessage } from '../calendarErrors'
import { useSyncLiturgicalDays } from '../hooks/useLiturgicalDays'
import type { SyncAffectedEvent } from '../api/liturgicalDaysApi'
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
  // The day's celebration is the panel's title; its rank and season sit on one quiet line under it.
  return (
    <Flex vertical gap={spacing.xs}>
      <h2 className="hm-preview__title" style={{ fontSize: 24 }}>
        {celebrationName}
      </h2>
      <Flex align="center" gap={spacing.xs} wrap>
        {seasonName && <SeasonChip size="small" seasonKey={seasonKey} color={color} seasonName={seasonName} />}
        {rank && <Typography.Text style={muted}>{rank}</Typography.Text>}
      </Flex>
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
  const navigate = useNavigate()

  /**
   * Upcoming events on a day that now has another celebration: the priest checks their readings and songs. The dialog
   * is drawn outside the router's tree, so a title closes it and navigates.
   */
  const showAffected = (events: SyncAffectedEvent[]) => {
    const open = (eventId: string) => {
      dialog.destroy()
      navigate(generatePath(paths.priest.programDetail, { programId: eventId }))
    }
    const dialog = modal.info({
      title: `${events.length} chương trình sắp tới đổi ngày lễ`,
      content: (
        <ul style={{ paddingInlineStart: spacing.md, margin: 0 }}>
          {events.map((event) => (
            <li key={event.eventId}>
              <Button type="link" style={{ padding: 0, height: 'auto', fontWeight: 600 }} onClick={() => open(event.eventId)}>
                {event.title || 'Chương trình'}
              </Button>{' '}
              {dayjs(event.eventDate).format('DD/MM/YYYY')} {event.time.slice(0, 5)}:{' '}
              {event.previousCelebrationName ?? 'chưa có tên lễ'} → {event.celebrationName ?? 'chưa có tên lễ'}
            </li>
          ))}
        </ul>
      ),
      okText: 'Đã hiểu',
    })
  }

  const confirm = () =>
    modal.confirm({
      title: `Đồng bộ lịch phụng vụ năm ${year}?`,
      content: `Harmonia lấy lịch phụng vụ năm ${year} từ nguồn lịch trực tuyến và ghi đè các ngày phụng vụ đã có của năm này.`,
      okText: 'Đồng bộ',
      cancelText: CANCEL_LABEL,
      onOk: () =>
        sync
          .mutateAsync(year)
          .then(({ syncedCount, affectedEvents }) => {
            message.success(`Đã đồng bộ ${syncedCount} ngày phụng vụ năm ${year}.`)
            if (!affectedEvents.length) return
            showAffected(affectedEvents)
          })
          .catch((error: Error) => message.error(calendarErrorMessage(error, 'Không thể đồng bộ lịch phụng vụ. Vui lòng thử lại.'))),
    })

  return (
    <Button icon={<Icon name="refresh" />} loading={sync.isPending} onClick={confirm}>
      Đồng bộ lịch phụng vụ {year}
    </Button>
  )
}
