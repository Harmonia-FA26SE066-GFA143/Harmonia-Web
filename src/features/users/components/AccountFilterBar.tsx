import { ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Flex, Input, Select, Typography } from 'antd'
import { roleLabels } from '@/shared/types/account'
import { colors, sizes, spacing, typography } from '@/styles/tokens'
import { hasActiveFilters } from '../accountFilters'
import { assignableRoles } from '../roles'
import { accountStatusLabels, type AccountFilters } from '../types'

export interface AccountFilterBarProps {
  value: AccountFilters
  onChange: (value: AccountFilters) => void
  onReset: () => void
  /** Number of accounts matching the filters. */
  resultCount: number
}

export function AccountFilterBar({ value, onChange, onReset, resultCount }: Readonly<AccountFilterBarProps>) {
  const labelStyle = { fontSize: typography.metadata.fontSize, color: colors.textMuted }
  return (
    <Flex wrap align="end" gap={spacing.sm} style={{ padding: spacing.md }}>
      <Input
        allowClear
        prefix={<SearchOutlined aria-hidden />}
        placeholder="Tìm theo email…"
        aria-label="Tìm tài khoản theo email"
        value={value.search}
        onChange={(event) => onChange({ ...value, search: event.target.value })}
        style={{ flex: '1 1 260px', maxWidth: 360 }}
      />
      {/* Visible labels: once a value is chosen the placeholder is gone and the two filters would look alike. */}
      <Flex vertical gap={4} style={{ flex: '0 1 220px', minWidth: 180 }}>
        <label htmlFor="account-filter-role" style={labelStyle}>
          Vai trò
        </label>
        <Select
          id="account-filter-role"
          allowClear
          placeholder="Tất cả vai trò"
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
          id="account-filter-status"
          allowClear
          placeholder="Tất cả trạng thái"
          value={value.isActive}
          onChange={(isActive) => onChange({ ...value, isActive })}
          options={[
            { value: true, label: accountStatusLabels.active },
            { value: false, label: accountStatusLabels.inactive },
          ]}
        />
      </Flex>
      <Button icon={<ReloadOutlined />} onClick={onReset} disabled={!hasActiveFilters(value)}>
        Đặt lại bộ lọc
      </Button>
      <Typography.Text aria-live="polite" style={{ marginInlineStart: 'auto', color: colors.textMuted, lineHeight: `${sizes.controlHeight}px` }}>
        {resultCount} tài khoản
      </Typography.Text>
    </Flex>
  )
}
