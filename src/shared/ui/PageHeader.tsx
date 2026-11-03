import { Breadcrumb, Flex, Typography, type BreadcrumbProps } from 'antd'
import type { ReactNode } from 'react'
import { colors, spacing, typography } from '@/styles/tokens'
import { ChantStaff } from './ChantStaff'

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
 * Page title block, set like the head of a chant page: the title in the display serif over a short chant incipit
 * (owner 2026-11-03), an optional one-line description, actions on the right. The breadcrumb shows
 * only on pages below a section (three levels or more); on a section's own page the sidebar already says where you are.
 */
export function PageHeader({ title, description, breadcrumb, tags, extra }: Readonly<PageHeaderProps>) {
  return (
    <header style={{ marginBottom: spacing.lg }}>
      <Flex wrap align="flex-end" justify="space-between" gap={spacing.md}>
        <div style={{ minWidth: 0, flex: '1 1 auto' }}>
          {breadcrumb && breadcrumb.length > 2 && (
            <Breadcrumb
              items={breadcrumb}
              style={{
                marginBottom: spacing.xs,
                fontSize: typography.metadata.fontSize,
                fontWeight: 500,
              }}
            />
          )}
          <Flex align="center" wrap gap={spacing.sm}>
            <Typography.Title
              level={1}
              style={{
                margin: 0,
                fontFamily: typography.displayFontFamily,
                fontSize: 36,
                fontWeight: 600,
                lineHeight: 1.2,
                fontVariantNumeric: 'lining-nums',
              }}
            >
              {title}
            </Typography.Title>
            {tags}
          </Flex>
          <div style={{ marginTop: spacing.sm }}>
            <ChantStaff />
          </div>
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
    </header>
  )
}
