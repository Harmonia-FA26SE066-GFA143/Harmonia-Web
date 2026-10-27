import { Flex, Typography } from 'antd'
import type { ReactNode } from 'react'
import { colors, radius, spacing, typography } from '@/styles/tokens'
import { SignInImage } from './SignInImage'

export interface AuthCardProps {
  title: ReactNode
  description?: ReactNode
  /** Decorative icon above the title (e.g. on result screens). */
  icon?: ReactNode
  children?: ReactNode
  /** Secondary links below the card (e.g. "Quay lại đăng nhập"). */
  footer?: ReactNode
}

/**
 * Frame shared by the sign-in and password screens: the church image with the brand on the left, the card on the
 * right (desktop web only, owner decision 2026-10-23).
 */
export function AuthCard({ title, description, icon, children, footer }: Readonly<AuthCardProps>) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
        gap: spacing.xl,
        minHeight: `calc(100vh - ${spacing.xl * 2}px)`,
      }}
    >
      <SignInImage />
      <Flex vertical align="center" justify="center" gap={spacing.lg} style={{ paddingBlock: spacing.xl }}>
        <section
          style={{
            width: '100%',
            maxWidth: 440,
            padding: '36px 32px',
            background: colors.surface,
            border: '1px solid rgba(0, 0, 0, 0.06)',
            borderRadius: 16,
          }}
        >
          {icon && (
            <Flex
              aria-hidden
              align="center"
              justify="center"
              style={{
                width: 56,
                height: 56,
                marginBottom: spacing.md,
                borderRadius: radius.md,
                fontSize: 26,
                background: colors.primarySoft,
                color: colors.primary,
              }}
            >
              {icon}
            </Flex>
          )}
          <Typography.Title
            level={1}
            style={{
              margin: 0,
              fontSize: typography.panelTitle.fontSize,
              lineHeight: typography.panelTitle.lineHeight,
              letterSpacing: '-0.01em',
            }}
          >
            {title}
          </Typography.Title>
          {description && (
            <Typography.Paragraph style={{ margin: `${spacing.xs}px 0 0`, color: colors.textMuted, fontSize: 13.5 }}>
              {description}
            </Typography.Paragraph>
          )}
          {children && <div style={{ marginTop: spacing.lg }}>{children}</div>}
        </section>
        {footer && <Typography.Text style={{ color: colors.textBody, fontSize: 13 }}>{footer}</Typography.Text>}
      </Flex>
    </div>
  )
}
