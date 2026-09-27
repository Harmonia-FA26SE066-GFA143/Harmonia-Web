import { Flex, theme, Typography } from 'antd'
import type { ReactNode } from 'react'
import { colors, radius, spacing } from '@/styles/tokens'

export interface StatePanelProps {
  icon: ReactNode
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  tone?: 'neutral' | 'danger'
  role?: 'status' | 'alert'
}

/** Shared layout for empty / error / no-result states: icon, heading, explanation, actions. */
export function StatePanel({ icon, title, description, actions, tone = 'neutral', role }: StatePanelProps) {
  const { token } = theme.useToken()
  const danger = tone === 'danger'

  return (
    <Flex
      component="section"
      role={role}
      vertical
      align="center"
      style={{
        padding: `${spacing.xxl}px ${spacing.lg}px`,
        textAlign: 'center',
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.lg,
      }}
    >
      <Flex
        aria-hidden
        align="center"
        justify="center"
        style={{
          width: 64,
          height: 64,
          marginBottom: spacing.md,
          borderRadius: radius.lg,
          fontSize: 28,
          background: danger ? token.colorErrorBg : colors.softSurface,
          color: danger ? token.colorError : colors.textMuted,
        }}
      >
        {icon}
      </Flex>
      <Typography.Title level={2} style={{ margin: 0 }}>
        {title}
      </Typography.Title>
      {description && (
        <Typography.Paragraph style={{ maxWidth: 520, margin: `${spacing.sm}px 0 0`, color: colors.textMuted }}>
          {description}
        </Typography.Paragraph>
      )}
      {actions && (
        <Flex wrap justify="center" gap={spacing.sm} style={{ marginTop: spacing.lg }}>
          {actions}
        </Flex>
      )}
    </Flex>
  )
}
