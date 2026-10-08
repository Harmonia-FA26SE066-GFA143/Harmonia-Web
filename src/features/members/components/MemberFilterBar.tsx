import { ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Flex, Input, Select, Typography } from 'antd'
import { useCatalogOptions } from '@/features/system-categories'
import { colors, spacing } from '@/styles/tokens'
import { hasActiveMemberFilters } from '../memberFilters'
import { memberStatuses, memberStatusLabels, type MemberFilters } from '../types'

export interface MemberFilterBarProps {
  value: MemberFilters
  onChange: (value: MemberFilters) => void
  onReset: () => void
  /** Number of members matching the filters. */
  resultCount: number
}

export function MemberFilterBar({ value, onChange, onReset, resultCount }: MemberFilterBarProps) {
  const skills = useCatalogOptions('skills')
  return (
    <Flex wrap align="center" gap={spacing.sm} style={{ padding: spacing.md }}>
      <Input
        allowClear
        prefix={<SearchOutlined aria-hidden />}
        placeholder="Tìm theo họ tên hoặc email…"
        aria-label="Tìm ca viên theo họ tên hoặc email"
        value={value.search}
        onChange={(event) => onChange({ ...value, search: event.target.value })}
        style={{ flex: '1 1 260px', maxWidth: 360 }}
      />
      <Select
        allowClear
        aria-label="Lọc theo trạng thái"
        placeholder="Tất cả trạng thái"
        value={value.status}
        onChange={(status) => onChange({ ...value, status })}
        options={memberStatuses.map((status) => ({ value: status, label: memberStatusLabels[status] }))}
        style={{ flex: '0 1 200px', minWidth: 170 }}
      />
      <Select
        allowClear
        showSearch
        optionFilterProp="label"
        aria-label="Lọc theo kỹ năng đã duyệt"
        placeholder="Tất cả kỹ năng"
        value={value.skillId}
        onChange={(skillId) => onChange({ ...value, skillId })}
        options={skills}
        style={{ flex: '0 1 200px', minWidth: 170 }}
      />
      <Button icon={<ReloadOutlined />} onClick={onReset} disabled={!hasActiveMemberFilters(value)}>
        Đặt lại bộ lọc
      </Button>
      <Typography.Text aria-live="polite" style={{ marginInlineStart: 'auto', color: colors.textMuted }}>
        {resultCount} ca viên
      </Typography.Text>
    </Flex>
  )
}
