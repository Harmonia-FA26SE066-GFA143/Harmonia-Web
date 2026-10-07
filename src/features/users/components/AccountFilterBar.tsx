import { ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Flex, Input, Select, Typography } from 'antd'
import { roleLabels } from '@/shared/types/account'
import { colors, spacing } from '@/styles/tokens'
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

export function AccountFilterBar({ value, onChange, onReset, resultCount }: AccountFilterBarProps) {
  return (
    <Flex wrap align="center" gap={spacing.sm} style={{ padding: spacing.md }}>
      <Input
        allowClear
        prefix={<SearchOutlined aria-hidden />}
        placeholder="Tìm theo email…"
        aria-label="Tìm tài khoản theo email"
        value={value.search}
        onChange={(event) => onChange({ ...value, search: event.target.value })}
        style={{ flex: '1 1 260px', maxWidth: 360 }}
      />
      <Select
        allowClear
        aria-label="Lọc theo vai trò"
        placeholder="Tất cả vai trò"
        value={value.role}
        onChange={(role) => onChange({ ...value, role })}
        options={assignableRoles.map((role) => ({ value: role, label: roleLabels[role] }))}
        style={{ flex: '0 1 220px', minWidth: 180 }}
      />
      <Select
        allowClear
        aria-label="Lọc theo trạng thái"
        placeholder="Tất cả trạng thái"
        value={value.isActive}
        onChange={(isActive) => onChange({ ...value, isActive })}
        options={[
          { value: true, label: accountStatusLabels.active },
          { value: false, label: accountStatusLabels.inactive },
        ]}
        style={{ flex: '0 1 200px', minWidth: 170 }}
      />
      <Button icon={<ReloadOutlined />} onClick={onReset} disabled={!hasActiveFilters(value)}>
        Đặt lại bộ lọc
      </Button>
      <Typography.Text aria-live="polite" style={{ marginInlineStart: 'auto', color: colors.textMuted }}>
        {resultCount} tài khoản
      </Typography.Text>
    </Flex>
  )
}
