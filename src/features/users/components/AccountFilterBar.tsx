import { Flex, Input, Select } from 'antd'
import { roleLabels } from '@/shared/types/account'
import { FilterBar, filterAllPlaceholder, Icon, SELECT_POPUP_PROPS } from '@/shared/ui'
import { colors, typography } from '@/styles/tokens'
import { hasActiveFilters } from '../accountFilters'
import { assignableRoles } from '../roles'
import { accountStatusLabels, type AccountFilters } from '../types'

export interface AccountFilterBarProps {
  value: AccountFilters
  onChange: (value: AccountFilters) => void
  onReset: () => void
  /** Number of accounts matching the filters; undefined while unknown. */
  resultCount?: number
  /** The accounts query failed, so the count is not shown as loading forever. */
  error?: boolean
}

export function AccountFilterBar({ value, onChange, onReset, resultCount, error = false }: Readonly<AccountFilterBarProps>) {
  const labelStyle = { fontSize: typography.metadata.fontSize, color: colors.textMuted }
  return (
    <FilterBar
      resultCount={error ? undefined : resultCount}
      error={error}
      resultNoun="tài khoản"
      hasActiveFilters={hasActiveFilters(value)}
      onReset={onReset}
    >
      {/* Visible labels: once a value is typed or chosen the placeholder is gone and the fields would look alike. */}
      <Flex vertical gap={4} style={{ flex: '1 1 260px', maxWidth: 360 }}>
        <label htmlFor="account-filter-search" style={labelStyle}>
          Tìm tài khoản theo email
        </label>
        <Input
          id="account-filter-search"
          allowClear
          // SearchUsersRequestValidator: search ≤ 100.
          maxLength={100}
          prefix={<Icon name="search" />}
          placeholder="Nhập họ tên hoặc email (vd: ten@giaoxu.org)"
          value={value.search}
          onChange={(event) => onChange({ ...value, search: event.target.value })}
        />
      </Flex>
      <Flex vertical gap={4} style={{ flex: '0 1 220px', minWidth: 180 }}>
        <label htmlFor="account-filter-role" style={labelStyle}>
          Vai trò
        </label>
        <Select
          {...SELECT_POPUP_PROPS}
          id="account-filter-role"
          allowClear
          placeholder={filterAllPlaceholder('vai trò')}
          value={value.role}
          onChange={(role) => onChange({ ...value, role })}
          options={assignableRoles.map((role) => ({ value: role, label: roleLabels[role] }))}
        />
      </Flex>
      <Flex vertical gap={4} style={{ flex: '0 1 200px', minWidth: 170 }}>
        <label htmlFor="account-filter-status" style={labelStyle}>
          Trạng thái
        </label>
        <Select
          {...SELECT_POPUP_PROPS}
          id="account-filter-status"
          allowClear
          placeholder={filterAllPlaceholder('trạng thái')}
          value={value.isActive}
          onChange={(isActive) => onChange({ ...value, isActive })}
          options={[
            { value: true, label: accountStatusLabels.active },
            { value: false, label: accountStatusLabels.inactive },
          ]}
        />
      </Flex>
    </FilterBar>
  )
}
