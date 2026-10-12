import { ReloadOutlined } from '@ant-design/icons'
import { Button, Flex, Select, Tag, Typography } from 'antd'
import { colors, spacing } from '@/styles/tokens'
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

export function ActivityFilterBar({ value, onChange, onReset, resultCount }: ActivityFilterBarProps) {
  return (
    <Flex wrap align="center" gap={spacing.sm} style={{ padding: spacing.md }}>
      <Select
        allowClear
        showSearch
        optionFilterProp="label"
        aria-label="Lọc theo loại dữ liệu"
        placeholder="Mọi loại dữ liệu"
        value={value.entityType}
        onChange={(entityType?: string) => onChange({ ...value, entityType })}
        options={options(entityTypeLabels)}
        style={{ flex: '0 1 240px', minWidth: 200 }}
      />
      <Select
        allowClear
        aria-label="Lọc theo thao tác"
        placeholder="Mọi thao tác"
        value={value.action}
        onChange={(action?: string) => onChange({ ...value, action })}
        options={options(actionLabels)}
        style={{ flex: '0 1 180px', minWidth: 160 }}
      />
      <Select
        allowClear
        aria-label="Lọc theo thời gian"
        placeholder="Mọi thời gian"
        value={value.period}
        onChange={(period?: ActivityPeriod) => onChange({ ...value, period })}
        options={options(periodLabels)}
        style={{ flex: '0 1 160px', minWidth: 140 }}
      />
      {value.user && (
        <Tag closable onClose={() => onChange({ ...value, user: undefined })} style={{ marginInlineEnd: 0 }}>
          Người thực hiện: {value.user.name}
        </Tag>
      )}
      <Button icon={<ReloadOutlined />} onClick={onReset} disabled={!hasActiveActivityFilters(value)}>
        Đặt lại bộ lọc
      </Button>
      <Typography.Text aria-live="polite" style={{ marginInlineStart: 'auto', color: colors.textMuted }}>
        {resultCount} bản ghi
      </Typography.Text>
    </Flex>
  )
}
