import { Flex, Typography } from 'antd'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { paths } from '@/app/router/paths'
import { BrandMark } from '@/shared/ui'
import { colors, radius, spacing, typography } from '@/styles/tokens'

export interface AuthCardProps {
  title: ReactNode
  description?: ReactNode
  /** Decorative icon above the title (e.g. on result screens). */
  icon?: ReactNode
  children?: ReactNode
  /** Secondary links below the card (e.g. "Quay lại đăng nhập"). */
  footer?: ReactNode
}

/** Centered card frame shared by the sign-in and password screens. */
export function AuthCard({ title, description, icon, children, footer }: Readonly<AuthCardProps>) {
  return (
    <Flex vertical align="center" gap={spacing.lg} style={{ paddingBlock: `${spacing.xl}px ${spacing.xxl}px` }}>
      <Link to={paths.home} style={{ textAlign: 'center', textDecoration: 'none' }}>
        <BrandMark size={48} style={{ boxShadow: '0 8px 20px rgba(142, 59, 75, 0.28)', margin: '0 auto 12px' }} />
        <Typography.Text
          strong
          style={{
            display: 'block',
            fontSize: 26,
            color: colors.primary,
            letterSpacing: '-0.02em',
          }}
        >
          Harmonia
        </Typography.Text>
        <Typography.Text style={{ fontSize: typography.metadata.fontSize, color: colors.textMuted, fontWeight: 500 }}>
          Điều phối ca đoàn và quản lý âm nhạc phụng vụ
        </Typography.Text>
      </Link>
      <section
        style={{
          width: '100%',
          maxWidth: 440,
          padding: '36px 32px',
          background: colors.surface,
          border: '1px solid rgba(0, 0, 0, 0.06)',
          borderRadius: 16,
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.03)',
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
  )
}
