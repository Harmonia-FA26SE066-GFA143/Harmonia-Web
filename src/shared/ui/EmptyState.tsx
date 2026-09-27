import { InboxOutlined } from '@ant-design/icons'
import type { ReactNode } from 'react'
import { StatePanel } from './StatePanel'

export interface EmptyStateProps {
  /** What is empty, e.g. "Chưa có tài khoản nào". */
  title: ReactNode
  /** Why the user may see this and what they can do next. */
  description?: ReactNode
  /** Optional action (e.g. a create button) when one exists for the user. */
  action?: ReactNode
  icon?: ReactNode
}

export function EmptyState({ title, description, action, icon = <InboxOutlined /> }: EmptyStateProps) {
  return <StatePanel role="status" icon={icon} title={title} description={description} actions={action} />
}
