import { Card, Col, Flex, Row, Typography } from 'antd'
import type { ComponentType } from 'react'
import { Link } from 'react-router'
import { colors, spacing } from '@/styles/tokens'

export interface Shortcut {
  path: string
  title: string
  description: string
  icon: ComponentType
}

/** The "Truy cập nhanh" cards of a dashboard: one linked card per area, four to a row on wide screens. */
export function ShortcutCards({ shortcuts }: Readonly<{ shortcuts: Shortcut[] }>) {
  return (
    <Row gutter={[spacing.md, spacing.md]}>
      {shortcuts.map(({ path, title, description, icon: Icon }) => (
        <Col key={path} xs={24} sm={12} xl={6}>
          <Link to={path} style={{ display: 'block', height: '100%' }}>
            <Card hoverable style={{ height: '100%' }} styles={{ body: { padding: spacing.md } }}>
              <Flex align="center" gap={spacing.sm} style={{ marginBottom: spacing.xs }}>
                <span aria-hidden style={{ color: colors.primary, fontSize: 18 }}>
                  <Icon />
                </span>
                <Typography.Text strong>{title}</Typography.Text>
              </Flex>
              <Typography.Text style={{ color: colors.textMuted }}>{description}</Typography.Text>
            </Card>
          </Link>
        </Col>
      ))}
    </Row>
  )
}
