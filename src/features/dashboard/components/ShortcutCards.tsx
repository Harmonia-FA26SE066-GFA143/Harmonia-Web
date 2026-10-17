import { Card, Col, Flex, Row, Typography } from 'antd'
import type { ComponentType } from 'react'
import { Link } from 'react-router'
import { IconTile } from '@/shared/ui'
import { cardSurface, colors, spacing } from '@/styles/tokens'

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
          <Link to={path} style={{ display: 'block', height: '100%', textDecoration: 'none' }}>
            <Card
              hoverable
              style={{ ...cardSurface, height: '100%' }}
              styles={{ body: { padding: '18px 20px', height: '100%' } }}
            >
              <Flex vertical gap={spacing.sm} style={{ height: '100%' }}>
                <Flex align="center" gap={spacing.sm}>
                  <IconTile size={38}>
                    <Icon />
                  </IconTile>
                  <Typography.Text strong style={{ fontSize: 14.5 }}>
                    {title}
                  </Typography.Text>
                </Flex>
                <Typography.Text style={{ color: colors.textMuted, fontSize: 13, lineHeight: 1.5 }}>
                  {description}
                </Typography.Text>
              </Flex>
            </Card>
          </Link>
        </Col>
      ))}
    </Row>
  )
}
