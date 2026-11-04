import type { ReactNode } from 'react'
import { EmptyStaff } from './ChantStaff'
import { StatePanel } from './StatePanel'

export interface EmptyStateProps {
  /** What is empty, e.g. "Chưa có tài khoản nào". */
  title: ReactNode
  /** Why the user may see this and what they can do next. */
  description?: ReactNode
  /** Optional action (e.g. a create button) when one exists for the user. */
  action?: ReactNode
  /** A subject icon when one names what is missing; otherwise a staff with nothing written yet. */
  icon?: ReactNode
  /** 3 when the panel sits inside a section that has its own level 2 heading. */
  headingLevel?: 2 | 3
}

export function EmptyState({
  title,
  description,
  action,
  icon = <EmptyStaff />,
  headingLevel,
}: Readonly<EmptyStateProps>) {
  return (
    <StatePanel
      role="status"
      tone="empty"
      icon={icon}
      title={title}
      description={description}
      actions={action}
      headingLevel={headingLevel}
    />
  )
}
