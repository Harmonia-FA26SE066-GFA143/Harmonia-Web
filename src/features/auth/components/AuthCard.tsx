import { Flex, Typography } from 'antd'
import type { ReactNode } from 'react'
import { colors, gold, radius, spacing, typography } from '@/styles/tokens'
import { SignInImage } from './SignInImage'

export interface AuthCardProps {
  title: ReactNode
  description?: ReactNode
  /** Decorative icon above the title (e.g. on result screens). */
  icon?: ReactNode
  children?: ReactNode
  /** Secondary links below the form (e.g. "Quay lại đăng nhập"). */
  footer?: ReactNode
}

/**
 * Frame shared by the sign-in and password screens (desktop web only, owner decision 2026-10-23): the drawn nave with a
 * psalm verse, and the form on an ivory panel at the right (owner 2026-11-02). It covers the blank layout's padding so
 * the scene reaches the edges.
 */
export function AuthCard({ title, description, icon, children, footer }: Readonly<AuthCardProps>) {
  return (
    <div style={{ position: 'fixed', inset: 0, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 520px' }}>
      <SignInImage />
      <section
        className="hm-paper"
        style={{
          position: 'relative',
          margin: spacing.lg,
          padding: `${spacing.xxl}px ${spacing.xxl}px`,
          borderRadius: radius.lg * 2,
          background: colors.ivory,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {icon && (
          <Flex
            aria-hidden
            align="center"
            justify="center"
            style={{ width: 56, height: 56, marginBottom: spacing.md, borderRadius: radius.md, fontSize: 26, background: colors.primarySoft, color: colors.primary }}
          >
            {icon}
          </Flex>
        )}
        <Typography.Title
          level={1}
          style={{ margin: 0, fontFamily: typography.displayFontFamily, fontWeight: 600, fontSize: 40, lineHeight: 1.1 }}
        >
          {title}
        </Typography.Title>
        <div aria-hidden style={{ width: 64, height: 1, background: gold.line, margin: `${spacing.md}px 0` }} />
        {description && <Typography.Paragraph style={{ margin: 0, color: colors.textMuted }}>{description}</Typography.Paragraph>}
        {children && <div style={{ marginTop: spacing.lg }}>{children}</div>}
        {footer && <Typography.Text style={{ display: 'block', marginTop: spacing.xl, color: colors.textBody, fontSize: 13 }}>{footer}</Typography.Text>}
      </section>
    </div>
  )
}
