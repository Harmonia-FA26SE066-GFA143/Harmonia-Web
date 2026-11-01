import type { ReactNode } from 'react'
import { CandleMark } from './CandleMark'
import { StatePanel } from './StatePanel'

export interface EmptyStateProps {
  /** What is empty, e.g. "Chưa có tài khoản nào". */
  title: ReactNode
  /** Why the user may see this and what they can do next. */
  description?: ReactNode
  /** Optional action (e.g. a create button) when one exists for the user. */
  action?: ReactNode
  /** A subject icon when one names what is missing; otherwise the candle motif of the redesign. */
  icon?: ReactNode
  /** 3 when the panel sits inside a section that has its own level 2 heading. */
  headingLevel?: 2 | 3
}

export function EmptyState({
  title,
  description,
  action,
  icon = <CandleMark />,
  headingLevel,
}: Readonly<EmptyStateProps>) {
  return (
    <StatePanel
      role="status"
      icon={icon}
      title={title}
      description={description}
      actions={action}
      headingLevel={headingLevel}
    />
  )
}
