import { Card, Col, Flex, Row, Typography } from 'antd'
import type { ComponentType } from 'react'
import { Link } from 'react-router'
import { colors, radius, spacing } from '@/styles/tokens'

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
              style={{
                height: '100%',
                borderRadius: radius.lg,
                border: '1px solid rgba(0, 0, 0, 0.06)',
                boxShadow: '0 2px 6px 0 rgba(0, 0, 0, 0.02)',
                background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFBFC 100%)',
              }}
              styles={{ body: { padding: '18px 20px', height: '100%' } }}
            >
              <Flex vertical gap={spacing.sm} style={{ height: '100%' }}>
                <Flex align="center" gap={spacing.sm}>
                  <div
                    aria-hidden
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: radius.md,
                      background: 'rgba(142, 59, 75, 0.08)',
                      color: colors.primary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    <Icon />
                  </div>
                  <Typography.Text strong style={{ fontSize: 14.5, color: colors.textPrimary }}>
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
