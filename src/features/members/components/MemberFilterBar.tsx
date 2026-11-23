import { Flex, Input, Select } from 'antd'
import { useCatalogOptions } from '@/features/system-categories'
import { filterAllPlaceholder, FilterBar, Icon, SELECT_POPUP_PROPS } from '@/shared/ui'
import { colors, spacing, typography } from '@/styles/tokens'
import { hasActiveMemberFilters } from '../memberFilters'
import { memberStatuses, memberStatusLabels, type MemberFilters } from '../types'

export interface MemberFilterBarProps {
  value: MemberFilters
  onChange: (value: MemberFilters) => void
  onReset: () => void
  /** Number of members matching the filters; undefined while loading. */
  resultCount?: number
  /** The list request failed, so the count reads as unavailable rather than loading (R2.5). */
  error?: boolean
}

const labelStyle = { fontSize: typography.metadata.fontSize, color: colors.textMuted }

export function MemberFilterBar({ value, onChange, onReset, resultCount, error }: Readonly<MemberFilterBarProps>) {
  const skills = useCatalogOptions('skills')
  return (
    <div style={{ marginBottom: spacing.lg }}>
      <FilterBar resultCount={resultCount} error={error} resultNoun="ca viên" hasActiveFilters={hasActiveMemberFilters(value)} onReset={onReset}>
        {/* Visible labels: once a value is typed or chosen the placeholder is gone and the fields would look alike. */}
        <Flex vertical gap={4} style={{ flex: '1 1 260px', maxWidth: 360 }}>
          <label htmlFor="member-filter-search" style={labelStyle}>
            Tìm ca viên
          </label>
          <Input
            id="member-filter-search"
            allowClear
            prefix={<Icon name="search" />}
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
            {...SELECT_POPUP_PROPS}
            id="member-filter-status"
            allowClear
            placeholder={filterAllPlaceholder('trạng thái')}
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
            {...SELECT_POPUP_PROPS}
            id="member-filter-skill"
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder={filterAllPlaceholder('kỹ năng')}
            value={value.skillId}
            onChange={(skillId) => onChange({ ...value, skillId })}
            options={skills}
          />
        </Flex>
      </FilterBar>
    </div>
  )
}
