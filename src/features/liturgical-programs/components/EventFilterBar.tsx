import { ReloadOutlined } from '@ant-design/icons'
import { Button, DatePicker, Flex, Select, Typography } from 'antd'
import dayjs from 'dayjs'
import { colors, spacing, typography } from '@/styles/tokens'
import { hasActiveEventFilters } from '../programFilters'
import { eventStatusLabels, type EventFilters, type EventStatus } from '../types'

export interface EventFilterBarProps {
  value: EventFilters
  onChange: (value: EventFilters) => void
  onReset: () => void
  resultCount: number
  /** Statuses offered; the Choir Director never sees drafts. */
  statuses?: EventStatus[]
}

/** The filters GET /api/liturgical-events offers: status and a date range. */
const allStatuses = Object.keys(eventStatusLabels) as EventStatus[]

export function EventFilterBar({
  value,
  onChange,
  onReset,
  resultCount,
  statuses = allStatuses,
}: Readonly<EventFilterBarProps>) {
  const labelStyle = { fontSize: typography.metadata.fontSize, color: colors.textMuted }
  return (
    <Flex wrap align="end" gap={spacing.sm} style={{ padding: spacing.md }}>
      <Flex vertical gap={4} style={{ flex: '0 1 200px', minWidth: 170 }}>
        <label htmlFor="event-filter-status" style={labelStyle}>
          Trạng thái
        </label>
      <Select
        id="event-filter-status"
        allowClear
        placeholder="Tất cả trạng thái"
        value={value.status}
        onChange={(status?: EventStatus) => onChange({ ...value, status })}
        options={statuses.map((status) => ({
          value: status,
          label: eventStatusLabels[status],
        }))}
      />
      </Flex>
      <Flex vertical gap={4} style={{ flex: '1 1 260px', maxWidth: 320 }}>
        <label htmlFor="event-filter-dates" style={labelStyle}>
          Khoảng ngày
        </label>
      <DatePicker.RangePicker
        id="event-filter-dates"
        format="DD/MM/YYYY"
        placeholder={['Từ ngày', 'Đến ngày']}
        allowEmpty={[true, true]}
        value={[value.fromDate ? dayjs(value.fromDate) : null, value.toDate ? dayjs(value.toDate) : null]}
        onChange={(range) =>
          onChange({
            ...value,
            fromDate: range?.[0]?.format('YYYY-MM-DD'),
            toDate: range?.[1]?.format('YYYY-MM-DD'),
          })
        }
      />
      </Flex>
      <Button icon={<ReloadOutlined />} onClick={onReset} disabled={!hasActiveEventFilters(value)}>
        Đặt lại bộ lọc
      </Button>
      <Typography.Text aria-live="polite" style={{ marginInlineStart: 'auto', color: colors.textMuted }}>
        {resultCount} sự kiện
      </Typography.Text>
    </Flex>
  )
}
