import { Avatar, Flex, Table, Tag, Typography, type TableColumnsType } from 'antd'
import type { ReactNode } from 'react'
import { roleLabels } from '@/shared/types/account'
import { colors, spacing, typography } from '@/styles/tokens'
import type { Account } from '../types'
import { personName } from '@/shared/utils/personName'
import { AccountStatusTag } from './AccountStatusTag'

export interface AccountTableProps {
  accounts: Account[]
  /** Server-side paging of GET /api/users. */
  page: number
  pageSize: number
  total: number
  loading?: boolean
  onPageChange: (page: number) => void
  renderActions: (account: Account) => ReactNode
}

const muted = { color: colors.textMuted, fontSize: typography.metadata.fontSize }
// The given name's first letter, as on the members list (artifact AccountsPage).
const initial = (fullName: string) => fullName.trim().split(/s+/).at(-1)?.charAt(0).toUpperCase() ?? ''

export function AccountTable({ accounts, page, pageSize, total, loading, onPageChange, renderActions }: Readonly<AccountTableProps>) {
  const columns: TableColumnsType<Account> = [
    {
      key: 'account',
      title: 'Tài khoản',
      render: (_, account) => (
        <Flex align="center" gap={spacing.sm}>
          {/* Neutral: burgundy belongs to the brand and the liturgy, not to account data. */}
          <Avatar aria-hidden style={{ flexShrink: 0, background: colors.softSurface, color: colors.textBody, fontWeight: 600 }}>
            {initial(account.fullName ?? '')}
          </Avatar>
          <Flex vertical>
          {account.fullName ? (
            <Typography.Text strong>{personName(account.fullName, account.saintName)}</Typography.Text>
          ) : (
            <Typography.Text style={{ color: colors.textMuted }}>Chưa có họ tên</Typography.Text>
          )}
          <Typography.Text style={muted}>{account.email}</Typography.Text>
          {account.phone && <Typography.Text style={muted}>{account.phone}</Typography.Text>}
          </Flex>
        </Flex>
      ),
    },
    {
      key: 'role',
      title: 'Vai trò',
      render: (_, account) => <Tag style={{ marginInlineEnd: 0 }}>{roleLabels[account.role]}</Tag>,
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (_, account) => (
        <Flex vertical align="flex-start" gap={2}>
          <AccountStatusTag isActive={account.isActive} />
          {account.isPasswordChangeRequired && (
            <Typography.Text style={muted}>Chưa đổi mật khẩu lần đầu</Typography.Text>
          )}
        </Flex>
      ),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'right',
      render: (_, account) => renderActions(account),
    },
  ]

  return (
    <Table<Account>
      rowKey="id"
      columns={columns}
      dataSource={accounts}
      loading={loading}
      pagination={{ current: page, pageSize, total, hideOnSinglePage: true, showSizeChanger: false, onChange: onPageChange }}
      scroll={{ x: 'max-content' }}
    />
  )
}
