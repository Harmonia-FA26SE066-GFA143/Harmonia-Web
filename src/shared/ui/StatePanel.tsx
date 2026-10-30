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

/** Shared layout for empty / error / no-result states: a quiet icon, heading, one sentence, actions. */
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
        padding: `${spacing.xl}px ${spacing.lg}px`,
        textAlign: 'center',
        ...cardSurface,
        borderRadius: radius.lg,
      }}
    >
      {/* A plain monochrome icon: no tinted circle around it. */}
      <span aria-hidden style={{ fontSize: 24, lineHeight: 1, marginBottom: spacing.sm, color: danger ? token.colorError : colors.textMuted }}>
        {icon}
      </span>
      <Typography.Title level={headingLevel} style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
        {title}
      </Typography.Title>
      {description && (
        <Typography.Paragraph
          style={{
            maxWidth: 520,
            margin: `${spacing.xs}px 0 0`,
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
