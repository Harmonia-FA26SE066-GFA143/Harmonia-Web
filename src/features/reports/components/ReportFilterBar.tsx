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
  showMonth?: boolean
  /** Options from the liturgical catalogs (FE-50); a filter is hidden when its options are not provided. */
  seasons?: FilterOption[]
  massTypes?: FilterOption[]
  ceremonyTypes?: FilterOption[]
}

/** Server-side report filters: month (FE-53) and liturgical catalog values. */
export function ReportFilterBar({
  value,
  onChange,
  onReset,
  showMonth = false,
  seasons,
  massTypes,
  ceremonyTypes,
}: ReportFilterBarProps) {
  const selects: { key: keyof ReportFilters; label: string; placeholder: string; options?: FilterOption[] }[] = [
    { key: 'seasonId', label: 'Mùa phụng vụ', placeholder: 'Tất cả mùa phụng vụ', options: seasons },
    { key: 'massTypeId', label: 'Loại Thánh lễ', placeholder: 'Tất cả loại Thánh lễ', options: massTypes },
    { key: 'ceremonyTypeId', label: 'Loại nghi thức', placeholder: 'Tất cả loại nghi thức', options: ceremonyTypes },
  ]
  // A visible label: once a value is chosen the placeholder is gone and the filters would look alike.
  const labelStyle = { fontSize: typography.metadata.fontSize, color: colors.textMuted }

  return (
    <Flex wrap align="end" gap={spacing.sm} style={{ marginBottom: spacing.md }}>
      {showMonth && (
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
      )}
      {selects
        .filter((select) => select.options)
        .map((select) => (
          <Flex key={select.key} vertical gap={4} style={{ flex: '0 1 220px', minWidth: 180 }}>
            <label htmlFor={`report-filter-${select.key}`} style={labelStyle}>
              {select.label}
            </label>
            <Select
              id={`report-filter-${select.key}`}
              allowClear
              placeholder={select.placeholder}
              value={value[select.key]}
              onChange={(selected?: string) => onChange({ ...value, [select.key]: selected })}
              options={select.options}
              style={{ width: '100%' }}
            />
          </Flex>
        ))}
      <Button icon={<ReloadOutlined />} onClick={onReset} disabled={!hasActiveReportFilters(value)}>
        Đặt lại bộ lọc
      </Button>
    </Flex>
  )
}
