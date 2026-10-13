import { ReloadOutlined } from '@ant-design/icons'
import { Button, DatePicker, Flex, Select } from 'antd'
import dayjs from 'dayjs'
import { colors, spacing, typography } from '@/styles/tokens'
import { hasActiveReportFilters } from '../reportFilters'
import type { ReportFilters } from '../types'

export interface FilterOption {
  value: string
  label: string
}

export interface ReportFilterBarProps {
  value: ReportFilters
  onChange: (value: ReportFilters) => void
  onReset: () => void
  /** Liturgical seasons (FE-50) to filter by. */
  seasons: FilterOption[]
}

/** Server-side report filters of SearchReportsRequest: month (FE-53) and liturgical season. */
export function ReportFilterBar({ value, onChange, onReset, seasons }: Readonly<ReportFilterBarProps>) {
  // A visible label: once a value is chosen the placeholder is gone and the filters would look alike.
  const labelStyle = { fontSize: typography.metadata.fontSize, color: colors.textMuted }

  return (
    <Flex wrap align="end" gap={spacing.sm} style={{ marginBottom: spacing.md }}>
      <Flex vertical gap={4} style={{ flex: '0 1 180px', minWidth: 160 }}>
        <label htmlFor="report-filter-month" style={labelStyle}>
          Tháng
        </label>
        <DatePicker
          id="report-filter-month"
          picker="month"
          format="MM/YYYY"
          placeholder="Tất cả các tháng"
          value={value.month ? dayjs(`${value.month}-01`) : null}
          onChange={(month) => onChange({ ...value, month: month ? month.format('YYYY-MM') : undefined })}
          style={{ width: '100%' }}
        />
      </Flex>
      <Flex vertical gap={4} style={{ flex: '0 1 220px', minWidth: 180 }}>
        <label htmlFor="report-filter-seasonId" style={labelStyle}>
          Mùa phụng vụ
        </label>
        <Select
          id="report-filter-seasonId"
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Tất cả mùa phụng vụ"
          value={value.seasonId}
          onChange={(seasonId?: string) => onChange({ ...value, seasonId })}
          options={seasons}
          style={{ width: '100%' }}
        />
      </Flex>
      <Button icon={<ReloadOutlined />} onClick={onReset} disabled={!hasActiveReportFilters(value)}>
        Đặt lại bộ lọc
      </Button>
    </Flex>
  )
}
