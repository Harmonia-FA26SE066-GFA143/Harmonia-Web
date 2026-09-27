import { Flex, Typography } from 'antd'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { paths } from '@/app/router/paths'
import { colors, radius, spacing, typography } from '@/styles/tokens'

export interface AuthCardProps {
  title: ReactNode
  description?: ReactNode
  /** Decorative icon above the title (e.g. on result screens). */
  icon?: ReactNode
  children?: ReactNode
  /** Secondary links below the card (e.g. "Chưa có tài khoản? Đăng ký"). */
  footer?: ReactNode
}

/** Centered card frame shared by the sign-in, registration, password and pending-confirmation screens. */
export function AuthCard({ title, description, icon, children, footer }: AuthCardProps) {
  return (
    <Flex vertical align="center" gap={spacing.lg} style={{ paddingBlock: spacing.xl }}>
      <Link to={paths.home} style={{ textAlign: 'center' }}>
        <Typography.Text strong style={{ display: 'block', fontSize: typography.panelTitle.fontSize, color: colors.primary }}>
          Harmonia
        </Typography.Text>
        <Typography.Text style={{ fontSize: typography.metadata.fontSize, color: colors.textMuted }}>
          Điều phối ca đoàn và quản lý âm nhạc phụng vụ
        </Typography.Text>
      </Link>
      <section
        style={{
          width: '100%',
          maxWidth: 440,
          padding: spacing.xl,
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.lg,
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
              borderRadius: radius.lg,
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
          style={{ margin: 0, fontSize: typography.panelTitle.fontSize, lineHeight: typography.panelTitle.lineHeight }}
        >
          {title}
        </Typography.Title>
        {description && (
          <Typography.Paragraph style={{ margin: `${spacing.xs}px 0 0`, color: colors.textMuted }}>
            {description}
          </Typography.Paragraph>
        )}
        {children && <div style={{ marginTop: spacing.lg }}>{children}</div>}
      </section>
      {footer && <Typography.Text style={{ color: colors.textBody }}>{footer}</Typography.Text>}
    </Flex>
  )
}
