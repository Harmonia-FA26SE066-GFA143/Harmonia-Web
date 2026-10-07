import { Flex, Table, Tag, Typography, type TableColumnsType } from 'antd'
import type { ReactNode } from 'react'
import { roleLabels } from '@/shared/types/account'
import { colors, typography } from '@/styles/tokens'
import type { Account } from '../types'
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

export function AccountTable({ accounts, page, pageSize, total, loading, onPageChange, renderActions }: AccountTableProps) {
  const columns: TableColumnsType<Account> = [
    {
      key: 'account',
      title: 'Tài khoản',
      render: (_, account) => (
        <Flex vertical>
          <Typography.Text strong>{account.fullName}</Typography.Text>
          <Typography.Text style={muted}>{account.email}</Typography.Text>
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
      render: (_, account) => <AccountStatusTag isActive={account.isActive} />,
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
