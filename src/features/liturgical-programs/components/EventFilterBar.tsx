import { ReloadOutlined } from '@ant-design/icons'
import { Button, DatePicker, Flex, Select, Typography } from 'antd'
import dayjs from 'dayjs'
import { colors, spacing } from '@/styles/tokens'
import { hasActiveEventFilters } from '../programFilters'
import { eventStatusLabels, type EventFilters, type EventStatus } from '../types'

export interface EventFilterBarProps {
  value: EventFilters
  onChange: (value: EventFilters) => void
  onReset: () => void
  resultCount: number
}

/** The filters GET /api/liturgical-events offers: status and a date range. */
export function EventFilterBar({ value, onChange, onReset, resultCount }: EventFilterBarProps) {
  return (
    <Flex wrap align="center" gap={spacing.sm} style={{ padding: spacing.md }}>
      <Select
        allowClear
        aria-label="Lọc theo trạng thái"
        placeholder="Tất cả trạng thái"
        value={value.status}
        onChange={(status?: EventStatus) => onChange({ ...value, status })}
        options={(Object.keys(eventStatusLabels) as EventStatus[]).map((status) => ({
          value: status,
          label: eventStatusLabels[status],
        }))}
        style={{ flex: '0 1 200px', minWidth: 170 }}
      />
      <DatePicker.RangePicker
        aria-label="Lọc theo khoảng ngày"
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
        style={{ flex: '1 1 260px', maxWidth: 320 }}
      />
      <Button icon={<ReloadOutlined />} onClick={onReset} disabled={!hasActiveEventFilters(value)}>
        Đặt lại bộ lọc
      </Button>
      <Typography.Text aria-live="polite" style={{ marginInlineStart: 'auto', color: colors.textMuted }}>
        {resultCount} sự kiện
      </Typography.Text>
    </Flex>
  )
}
