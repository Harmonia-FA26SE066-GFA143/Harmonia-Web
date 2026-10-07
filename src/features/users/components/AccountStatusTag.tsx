import { Tag } from 'antd'
import { accountStatusLabels } from '../types'

// Semantic colors keep Ant Design defaults (no approved values yet); the label always carries the meaning.
export function AccountStatusTag({ isActive }: { isActive: boolean }) {
  return (
    <Tag color={isActive ? 'green' : 'default'} style={{ marginInlineEnd: 0 }}>
      {isActive ? accountStatusLabels.active : accountStatusLabels.inactive}
    </Tag>
  )
}
