import { DatePicker, Flex, Select, Tag } from 'antd'
import dayjs from 'dayjs'
import type { ReactNode } from 'react'
import { FilterBar, SELECT_POPUP_PROPS, filterAllPlaceholder } from '@/shared/ui'
import { colors, sizes, typography } from '@/styles/tokens'
import { hasActiveActivityFilters, periodLabels } from '../activityFilters'
import { actionLabels, entityTypeLabels, type ActivityFilters, type ActivityPeriod } from '../types'

export interface ActivityFilterBarProps {
  value: ActivityFilters
  onChange: (value: ActivityFilters) => void
  onReset: () => void
  /** Records matching the filters on the server. */
  resultCount?: number
  /** True when the log query failed, so the count does not stay on "Đang tải…". */
  error?: boolean
}

const options = (labels: Record<string, string>) => Object.entries(labels).map(([value, label]) => ({ value, label }))

/** A filter with a visible label: once a value is chosen the placeholder is gone and the three would look alike. */
function Field({ id, label, width, children }: Readonly<{ id: string; label: string; width: number; children: ReactNode }>) {
  return (
    <Flex vertical gap={4} style={{ flex: `0 1 ${width}px`, minWidth: width - 40 }}>
      <label htmlFor={id} style={{ fontSize: typography.metadata.fontSize, color: colors.textMuted }}>
        {label}
      </label>
      {children}
    </Flex>
  )
}

export function ActivityFilterBar({ value, onChange, onReset, resultCount, error = false }: Readonly<ActivityFilterBarProps>) {
  return (
    <FilterBar
      resultCount={error ? undefined : resultCount}
      error={error}
      resultNoun="hoạt động"
      hasActiveFilters={hasActiveActivityFilters(value)}
      onReset={onReset}
    >
      <Field id="activity-filter-entity" label="Loại dữ liệu" width={240}>
        <Select
          {...SELECT_POPUP_PROPS}
          id="activity-filter-entity"
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder={filterAllPlaceholder('loại dữ liệu')}
          value={value.entityType}
          onChange={(entityType?: string) => onChange({ ...value, entityType })}
          options={options(entityTypeLabels)}
        />
      </Field>
      <Field id="activity-filter-action" label="Loại thay đổi" width={180}>
        <Select
          {...SELECT_POPUP_PROPS}
          id="activity-filter-action"
          allowClear
          placeholder={filterAllPlaceholder('loại thay đổi')}
          value={value.action}
          onChange={(action?: string) => onChange({ ...value, action })}
          options={options(actionLabels)}
        />
      </Field>
      <Field id="activity-filter-period" label="Thời gian" width={160}>
        <Select
          {...SELECT_POPUP_PROPS}
          id="activity-filter-period"
          allowClear
          placeholder={filterAllPlaceholder('thời gian')}
          value={value.period}
          onChange={(period?: ActivityPeriod) => onChange({ ...value, period, fromDate: undefined, toDate: undefined })}
          options={options(periodLabels)}
        />
      </Field>
      <Field id="activity-filter-range" label="Khoảng ngày" width={250}>
        <DatePicker.RangePicker
          getPopupContainer={SELECT_POPUP_PROPS.getPopupContainer}
          placement="bottomLeft"
          id="activity-filter-range"
          format="DD/MM/YYYY"
          placeholder={['Từ ngày', 'Đến ngày']}
          value={
            value.fromDate || value.toDate
              ? [value.fromDate ? dayjs(value.fromDate) : null, value.toDate ? dayjs(value.toDate) : null]
              : null
          }
          onChange={(dates) =>
            onChange({
              ...value,
              period: undefined,
              fromDate: dates?.[0]?.format('YYYY-MM-DD'),
              toDate: dates?.[1]?.format('YYYY-MM-DD'),
            })
          }
          style={{ width: '100%' }}
        />
      </Field>
      {value.user && (
        <Flex align="center" style={{ height: sizes.controlHeight, alignSelf: 'flex-end' }}>
          <Tag closable onClose={() => onChange({ ...value, user: undefined })} style={{ marginInlineEnd: 0 }}>
            Người thực hiện: {value.user.name}
          </Tag>
        </Flex>
      )}
    </FilterBar>
  )
}
