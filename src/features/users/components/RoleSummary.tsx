import { Card, Col, Row, Typography } from 'antd'
import { roleLabels, type SystemRole } from '@/shared/types/account'
import { colors, spacing, typography } from '@/styles/tokens'
import { assignableRoles, roleDescriptions } from '../roles'

export interface RoleSummaryProps {
  /** Number of accounts currently holding each role; undefined while loading or unavailable. */
  counts?: Record<SystemRole, number>
}

/** The fixed FE-48 roles with their responsibilities. Roles are not created or edited here. */
export function RoleSummary({ counts }: RoleSummaryProps) {
  return (
    <Row gutter={[spacing.md, spacing.md]}>
      {assignableRoles.map((role) => (
        <Col key={role} xs={24} sm={12} xl={6}>
          <Card style={{ height: '100%' }} styles={{ body: { padding: spacing.md } }}>
            <Typography.Title level={3} style={{ margin: 0 }}>
              {roleLabels[role]}
            </Typography.Title>
            <Typography.Paragraph style={{ margin: `${spacing.xs}px 0 ${spacing.sm}px`, color: colors.textMuted }}>
              {roleDescriptions[role]}
            </Typography.Paragraph>
            <Typography.Text style={{ fontSize: typography.metadata.fontSize, color: colors.textBody }}>
              Đang gán: <strong>{counts?.[role] ?? '–'}</strong> tài khoản
            </Typography.Text>
          </Card>
        </Col>
      ))}
    </Row>
  )
}
