import { ReloadOutlined } from '@ant-design/icons'
import { Button, DatePicker, Flex, Select } from 'antd'
import dayjs from 'dayjs'
import { spacing } from '@/styles/tokens'
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
    { key: 'seasonId', label: 'Lọc theo mùa phụng vụ', placeholder: 'Tất cả mùa phụng vụ', options: seasons },
    { key: 'massTypeId', label: 'Lọc theo loại Thánh lễ', placeholder: 'Tất cả loại Thánh lễ', options: massTypes },
    { key: 'ceremonyTypeId', label: 'Lọc theo loại nghi thức', placeholder: 'Tất cả loại nghi thức', options: ceremonyTypes },
  ]

  return (
    <Flex wrap align="center" gap={spacing.sm} style={{ marginBottom: spacing.md }}>
      {showMonth && (
        <DatePicker
          picker="month"
          format="MM/YYYY"
          placeholder="Tất cả các tháng"
          aria-label="Lọc theo tháng"
          value={value.month ? dayjs(`${value.month}-01`) : null}
          onChange={(month) => onChange({ ...value, month: month ? month.format('YYYY-MM') : undefined })}
          style={{ flex: '0 1 180px', minWidth: 160 }}
        />
      )}
      {selects
        .filter((select) => select.options)
        .map((select) => (
          <Select
            key={select.key}
            allowClear
            aria-label={select.label}
            placeholder={select.placeholder}
            value={value[select.key]}
            onChange={(selected?: string) => onChange({ ...value, [select.key]: selected })}
            options={select.options}
            style={{ flex: '0 1 220px', minWidth: 180 }}
          />
        ))}
      <Button icon={<ReloadOutlined />} onClick={onReset} disabled={!hasActiveReportFilters(value)}>
        Đặt lại bộ lọc
      </Button>
    </Flex>
  )
}
