import { SyncOutlined } from '@ant-design/icons'
import type { UseQueryResult } from '@tanstack/react-query'
import { App, Button, Flex, Tag, Typography } from 'antd'
import { colors, spacing } from '@/styles/tokens'
import { calendarErrorMessage } from '../calendarErrors'
import { useSyncLiturgicalDays } from '../hooks/useLiturgicalDays'
import { liturgicalRankLabels, liturgicalSeasonLabels, type LiturgicalDay } from '../types'

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

  const { celebrationName, rank, seasonName } = day
  return (
    <Flex align="center" gap={spacing.xs} wrap>
      <Typography.Text strong>{celebrationName}</Typography.Text>
      {rank && <Tag style={{ marginInlineEnd: 0 }}>{liturgicalRankLabels[rank] ?? rank}</Tag>}
      {seasonName && <Tag style={{ marginInlineEnd: 0 }}>{liturgicalSeasonLabels[seasonName] ?? seasonName}</Tag>}
    </Flex>
  )
}

/**
 * Parish Priest: syncs a civil year from the Liturgical Calendar API (Harmonia-BE LiturgicalDayService.SyncAsync). The
 * backend overwrites the days already cached for that year, so it asks first. Celebration names arrive in English.
 */
export function SyncCalendarButton({ year }: Readonly<{ year: number }>) {
  const { message, modal } = App.useApp()
  const sync = useSyncLiturgicalDays()

  const confirm = () =>
    modal.confirm({
      title: `Đồng bộ lịch phụng vụ năm ${year}?`,
      content: `Harmonia lấy lịch năm ${year} từ Liturgical Calendar API (tên lễ bằng tiếng Anh) và ghi đè các ngày phụng vụ đã có của năm này.`,
      okText: 'Đồng bộ',
      cancelText: 'Hủy',
      onOk: () =>
        sync
          .mutateAsync(year)
          .then((count) => message.success(`Đã đồng bộ ${count} ngày phụng vụ năm ${year}.`))
          .catch((error: Error) => message.error(calendarErrorMessage(error, 'Không thể đồng bộ lịch phụng vụ. Vui lòng thử lại.'))),
    })

  return (
    <Button icon={<SyncOutlined />} loading={sync.isPending} onClick={confirm}>
      Đồng bộ lịch phụng vụ {year}
    </Button>
  )
}
