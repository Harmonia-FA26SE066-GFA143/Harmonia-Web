import { Breadcrumb, Flex, Typography, type BreadcrumbProps } from 'antd'
import type { ReactNode } from 'react'
import { colors, spacing, typography } from '@/styles/tokens'

export interface PageHeaderProps {
  title: ReactNode
  description?: ReactNode
  breadcrumb?: BreadcrumbProps['items']
  /** Short labels shown next to the title (e.g. a status Tag). */
  tags?: ReactNode
  /** Page-level actions, primary action last. */
  extra?: ReactNode
}

/**
 * Page title block: title, an optional one-line description, actions on the right. The breadcrumb shows only on pages
 * below a section (three levels or more); on a section's own page the sidebar already says where you are.
 */
export function PageHeader({ title, description, breadcrumb, tags, extra }: Readonly<PageHeaderProps>) {
  return (
    <Flex
      component="header"
      wrap
      align="center"
      justify="space-between"
      gap={spacing.md}
      style={{
        marginBottom: spacing.lg,
      }}
    >
      <div style={{ minWidth: 0, flex: '1 1 auto' }}>
        {breadcrumb && breadcrumb.length > 2 && (
          <Breadcrumb
            items={breadcrumb}
            style={{
              marginBottom: 6,
              fontSize: 12.5,
              fontWeight: 500,
            }}
          />
        )}
        <Flex align="center" wrap gap={spacing.sm}>
          <Typography.Title
            level={1}
            style={{
              margin: 0,
              fontWeight: typography.pageTitle.fontWeight,
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </Typography.Title>
          {tags}
        </Flex>
        {description && (
          <Typography.Paragraph
            style={{
              margin: `${spacing.xs}px 0 0`,
              color: colors.textMuted,
              maxWidth: 720,
              lineHeight: 1.5,
            }}
          >
            {description}
          </Typography.Paragraph>
        )}
      </div>
      {extra && (
        <Flex wrap align="center" gap={spacing.sm} style={{ flexShrink: 0 }}>
          {extra}
        </Flex>
      )}
    </Flex>
  )
}
