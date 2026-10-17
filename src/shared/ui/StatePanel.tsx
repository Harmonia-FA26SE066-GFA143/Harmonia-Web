import { Flex, theme, Typography } from 'antd'
import type { ReactNode } from 'react'
import { cardSurface, colors, radius, spacing } from '@/styles/tokens'

export interface StatePanelProps {
  icon: ReactNode
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  tone?: 'neutral' | 'danger'
  role?: 'status' | 'alert'
  /** Level of the title: 3 when the panel sits inside a section that has its own level 2 heading. */
  headingLevel?: 2 | 3
}

/** Shared layout for empty / error / no-result states: icon, heading, explanation, actions. */
export function StatePanel({
  icon,
  title,
  description,
  actions,
  tone = 'neutral',
  role,
  headingLevel = 2,
}: Readonly<StatePanelProps>) {
  const { token } = theme.useToken()
  const danger = tone === 'danger'

  return (
    <Flex
      component="section"
      role={role}
      vertical
      align="center"
      style={{
        padding: `${spacing.xxl}px ${spacing.xl}px`,
        textAlign: 'center',
        ...cardSurface,
        borderRadius: radius.lg,
      }}
    >
      <Flex
        aria-hidden
        align="center"
        justify="center"
        style={{
          width: 72,
          height: 72,
          marginBottom: spacing.lg,
          borderRadius: '50%',
          fontSize: 28,
          background: danger ? token.colorErrorBg : 'rgba(142, 59, 75, 0.06)',
          border: `1px solid ${danger ? 'rgba(207, 19, 34, 0.15)' : 'rgba(142, 59, 75, 0.12)'}`,
          color: danger ? token.colorError : colors.primary,
          boxShadow: `0 4px 16px ${danger ? 'rgba(207, 19, 34, 0.08)' : 'rgba(142, 59, 75, 0.06)'}`,
        }}
      >
        {icon}
      </Flex>
      <Typography.Title level={headingLevel} style={{ margin: 0, letterSpacing: '-0.01em' }}>
        {title}
      </Typography.Title>
      {description && (
        <Typography.Paragraph
          style={{
            maxWidth: 520,
            margin: `${spacing.sm}px 0 0`,
            color: colors.textMuted,
            lineHeight: 1.55,
          }}
        >
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
