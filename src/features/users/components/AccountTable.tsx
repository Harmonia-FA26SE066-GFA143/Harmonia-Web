import { Flex, Table, Tag, Typography, type TableColumnsType } from 'antd'
import type { ReactNode } from 'react'
import { roleLabels } from '@/shared/types/account'
import { colors, typography } from '@/styles/tokens'
import type { Account } from '../types'
import { AccountStatusTag } from './AccountStatusTag'

export interface AccountTableProps {
  accounts: Account[]
  renderActions: (account: Account) => ReactNode
  showStatus?: boolean
}

const muted = { color: colors.textMuted, fontSize: typography.metadata.fontSize }

function RoleCell({ account }: { account: Account }) {
  if (account.role) return <Tag style={{ marginInlineEnd: 0 }}>{roleLabels[account.role]}</Tag>
  return (
    <Flex vertical>
      <Typography.Text style={{ color: colors.textMuted }}>
        {account.status === 'pending' ? 'Chưa xác nhận' : 'Chưa có vai trò'}
      </Typography.Text>
      {account.requestedRole && (
        <Typography.Text style={muted}>Đề nghị: {roleLabels[account.requestedRole]}</Typography.Text>
      )}
    </Flex>
  )
}

export function AccountTable({ accounts, renderActions, showStatus = true }: AccountTableProps) {
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
    { key: 'role', title: 'Vai trò', render: (_, account) => <RoleCell account={account} /> },
    ...(showStatus
      ? [
          {
            key: 'status',
            title: 'Trạng thái',
            render: (_: unknown, account: Account) => (
              <Flex vertical align="flex-start" gap={2}>
                <AccountStatusTag status={account.status} />
                {account.status === 'rejected' && account.rejectionReason && (
                  <Typography.Text style={muted}>Lý do: {account.rejectionReason}</Typography.Text>
                )}
              </Flex>
            ),
          },
        ]
      : []),
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
      pagination={{ pageSize: 10, hideOnSinglePage: true }}
      scroll={{ x: 'max-content' }}
    />
  )
}
