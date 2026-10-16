import { Typography } from 'antd'
import type { ReactNode } from 'react'

/** Card title as a level-2 heading, looking like the Ant Design card title, so the page outline has its sections. */
export function CardTitle({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <Typography.Title level={2} style={{ margin: 0, fontSize: 'inherit', lineHeight: 'inherit' }}>
      {children}
    </Typography.Title>
  )
}
