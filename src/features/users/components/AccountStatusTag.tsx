import { Tag } from 'antd'
import { accountStatusLabels, type AccountStatus } from '@/shared/types/account'

// Semantic colors keep Ant Design defaults (no approved values yet); the label always carries the meaning.
const statusColors: Record<AccountStatus, string> = {
  pending: 'gold',
  active: 'green',
  rejected: 'red',
  deactivated: 'default',
}

export function AccountStatusTag({ status }: { status: AccountStatus }) {
  return (
    <Tag color={statusColors[status]} style={{ marginInlineEnd: 0 }}>
      {accountStatusLabels[status]}
    </Tag>
  )
}
