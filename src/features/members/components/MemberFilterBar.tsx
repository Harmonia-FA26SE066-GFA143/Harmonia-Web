import { ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Flex, Input, Select, Typography } from 'antd'
import { useCatalogOptions } from '@/features/system-categories'
import { colors, sizes, spacing, typography } from '@/styles/tokens'
import { hasActiveMemberFilters } from '../memberFilters'
import { memberStatuses, memberStatusLabels, type MemberFilters } from '../types'

export interface MemberFilterBarProps {
  value: MemberFilters
  onChange: (value: MemberFilters) => void
  onReset: () => void
  /** Number of members matching the filters. */
  resultCount: number
}

export function MemberFilterBar({ value, onChange, onReset, resultCount }: Readonly<MemberFilterBarProps>) {
  const skills = useCatalogOptions('skills')
  const labelStyle = { fontSize: typography.metadata.fontSize, color: colors.textMuted }
  return (
    <Flex wrap align="end" gap={spacing.sm} style={{ padding: spacing.md }}>
      {/* Visible labels: once a value is typed or chosen the placeholder is gone and the fields would look alike. */}
      <Flex vertical gap={4} style={{ flex: '1 1 260px', maxWidth: 360 }}>
        <label htmlFor="member-filter-search" style={labelStyle}>
          Tìm ca viên
        </label>
        <Input
          id="member-filter-search"
          allowClear
          prefix={<SearchOutlined aria-hidden />}
          placeholder="Họ tên hoặc email…"
          value={value.search}
          onChange={(event) => onChange({ ...value, search: event.target.value })}
        />
      </Flex>
      <Flex vertical gap={4} style={{ flex: '0 1 200px', minWidth: 170 }}>
        <label htmlFor="member-filter-status" style={labelStyle}>
          Trạng thái
        </label>
        <Select
          id="member-filter-status"
          allowClear
          placeholder="Tất cả trạng thái"
          value={value.status}
          onChange={(status) => onChange({ ...value, status })}
          options={memberStatuses.map((status) => ({ value: status, label: memberStatusLabels[status] }))}
        />
      </Flex>
      <Flex vertical gap={4} style={{ flex: '0 1 200px', minWidth: 170 }}>
        <label htmlFor="member-filter-skill" style={labelStyle}>
          Kỹ năng đã duyệt
        </label>
        <Select
          id="member-filter-skill"
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Tất cả kỹ năng"
          value={value.skillId}
          onChange={(skillId) => onChange({ ...value, skillId })}
          options={skills}
        />
      </Flex>
      <Button icon={<ReloadOutlined />} onClick={onReset} disabled={!hasActiveMemberFilters(value)}>
        Đặt lại bộ lọc
      </Button>
      <Typography.Text aria-live="polite" style={{ marginInlineStart: 'auto', color: colors.textMuted, lineHeight: `${sizes.controlHeight}px` }}>
        {resultCount} ca viên
      </Typography.Text>
    </Flex>
  )
}
