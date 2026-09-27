import { ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Flex, Input, Select, Typography } from 'antd'
import { colors, spacing } from '@/styles/tokens'
import { hasActiveActivityFilters, periodLabels } from '../activityFilters'
import { activityTypeLabels, type ActivityFilters, type ActivityPeriod, type ActivityType } from '../types'

export interface ActivityFilterBarProps {
  value: ActivityFilters
  onChange: (value: ActivityFilters) => void
  onReset: () => void
  /** People who appear in the loaded records, for the actor filter. */
  actorNames: string[]
  resultCount: number
}

export function ActivityFilterBar({ value, onChange, onReset, actorNames, resultCount }: ActivityFilterBarProps) {
  return (
    <Flex wrap align="center" gap={spacing.sm} style={{ padding: spacing.md }}>
      <Input
        allowClear
        prefix={<SearchOutlined aria-hidden />}
        placeholder="Tìm theo người thực hiện, đối tượng…"
        aria-label="Tìm hoạt động"
        value={value.search}
        onChange={(event) => onChange({ ...value, search: event.target.value })}
        style={{ flex: '1 1 240px', maxWidth: 320 }}
      />
      <Select
        allowClear
        aria-label="Lọc theo hoạt động"
        placeholder="Tất cả hoạt động"
        value={value.type}
        onChange={(type?: ActivityType) => onChange({ ...value, type })}
        options={(Object.keys(activityTypeLabels) as ActivityType[]).map((type) => ({
          value: type,
          label: activityTypeLabels[type],
        }))}
        style={{ flex: '0 1 220px', minWidth: 180 }}
      />
      <Select
        allowClear
        showSearch
        aria-label="Lọc theo người thực hiện"
        placeholder="Tất cả người thực hiện"
        value={value.actorName}
        onChange={(actorName?: string) => onChange({ ...value, actorName })}
        options={actorNames.map((name) => ({ value: name, label: name }))}
        style={{ flex: '0 1 220px', minWidth: 180 }}
      />
      <Select
        allowClear
        aria-label="Lọc theo thời gian"
        placeholder="Mọi thời gian"
        value={value.period}
        onChange={(period?: ActivityPeriod) => onChange({ ...value, period })}
        options={(Object.keys(periodLabels) as ActivityPeriod[]).map((period) => ({
          value: period,
          label: periodLabels[period],
        }))}
        style={{ flex: '0 1 160px', minWidth: 140 }}
      />
      <Button icon={<ReloadOutlined />} onClick={onReset} disabled={!hasActiveActivityFilters(value)}>
        Đặt lại bộ lọc
      </Button>
      <Typography.Text aria-live="polite" style={{ marginInlineStart: 'auto', color: colors.textMuted }}>
        {resultCount} bản ghi
      </Typography.Text>
    </Flex>
  )
}
