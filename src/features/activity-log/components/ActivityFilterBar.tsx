import { ReloadOutlined } from '@ant-design/icons'
import { Button, Flex, Select, Tag, Typography } from 'antd'
import type { ReactNode } from 'react'
import { colors, sizes, spacing, typography } from '@/styles/tokens'
import { hasActiveActivityFilters, periodLabels } from '../activityFilters'
import { actionLabels, entityTypeLabels, type ActivityFilters, type ActivityPeriod } from '../types'

export interface ActivityFilterBarProps {
  value: ActivityFilters
  onChange: (value: ActivityFilters) => void
  onReset: () => void
  /** Records matching the filters on the server. */
  resultCount: number
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

export function ActivityFilterBar({ value, onChange, onReset, resultCount }: Readonly<ActivityFilterBarProps>) {
  return (
    <Flex wrap align="end" gap={spacing.sm} style={{ padding: spacing.md }}>
      <Field id="activity-filter-entity" label="Loại dữ liệu" width={240}>
        <Select
          id="activity-filter-entity"
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Mọi loại dữ liệu"
          value={value.entityType}
          onChange={(entityType?: string) => onChange({ ...value, entityType })}
          options={options(entityTypeLabels)}
        />
      </Field>
      <Field id="activity-filter-action" label="Thao tác" width={180}>
        <Select
          id="activity-filter-action"
          allowClear
          placeholder="Mọi thao tác"
          value={value.action}
          onChange={(action?: string) => onChange({ ...value, action })}
          options={options(actionLabels)}
        />
      </Field>
      <Field id="activity-filter-period" label="Thời gian" width={160}>
        <Select
          id="activity-filter-period"
          allowClear
          placeholder="Mọi thời gian"
          value={value.period}
          onChange={(period?: ActivityPeriod) => onChange({ ...value, period })}
          options={options(periodLabels)}
        />
      </Field>
      {value.user && (
        <Tag closable onClose={() => onChange({ ...value, user: undefined })} style={{ marginInlineEnd: 0 }}>
          Người thực hiện: {value.user.name}
        </Tag>
      )}
      <Button icon={<ReloadOutlined />} onClick={onReset} disabled={!hasActiveActivityFilters(value)}>
        Đặt lại bộ lọc
      </Button>
      <Typography.Text aria-live="polite" style={{ marginInlineStart: 'auto', color: colors.textMuted, lineHeight: `${sizes.controlHeight}px` }}>
        {resultCount} bản ghi
      </Typography.Text>
    </Flex>
  )
}
