import { UploadOutlined } from '@ant-design/icons'
import type { UseQueryResult } from '@tanstack/react-query'
import { App, Button, Flex, Tag, Typography, Upload } from 'antd'
import { colors, spacing } from '@/styles/tokens'
import { calendarErrorMessage } from '../calendarErrors'
import { useImportLiturgicalCalendar } from '../hooks/useLiturgicalDays'
import { liturgicalRankLabels, liturgicalSeasonLabels, type LiturgicalDay } from '../types'

const muted = { color: colors.textMuted }
const maxFileBytes = 2 * 1024 * 1024

/**
 * The liturgical day of `date` (YYYY-MM-DD) from the days loaded for its month: celebration, rank and season, or a
 * hint to import the calendar.
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
    return <Typography.Text style={muted}>Chưa có ngày phụng vụ cho ngày này. Nhập lịch phụng vụ (.ics) để hiển thị.</Typography.Text>
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
 * Parish Priest: imports a Catholic calendar feed (Harmonia-BE LiturgicalDayService.ImportAsync: .ics, ≤ 2 MB). Only
 * days not imported yet are added; the backend answers how many.
 */
export function ImportCalendarButton() {
  const { message } = App.useApp()
  const importCalendar = useImportLiturgicalCalendar()

  const handleFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.ics')) return message.error('Chỉ nhận file lịch .ics.')
    if (file.size > maxFileBytes) return message.error('File lịch tối đa 2 MB.')
    importCalendar.mutate(file, {
      onSuccess: (added) =>
        message.success(added > 0 ? `Đã nhập ${added} ngày phụng vụ mới.` : 'Các ngày trong file đã có sẵn, không có ngày mới.'),
      onError: (error) => message.error(calendarErrorMessage(error, 'Không thể nhập lịch phụng vụ. Vui lòng thử lại.')),
    })
  }

  return (
    <Upload
      accept=".ics"
      showUploadList={false}
      beforeUpload={(file) => {
        handleFile(file)
        return false
      }}
    >
      <Button icon={<UploadOutlined />} loading={importCalendar.isPending}>
        Nhập lịch phụng vụ (.ics)
      </Button>
    </Upload>
  )
}
