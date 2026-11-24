import { Breadcrumb, Flex, Typography, type BreadcrumbProps } from 'antd'
import type { ReactNode } from 'react'
import { colors, component, spacing, typography } from '@/styles/tokens'

export interface PageHeaderProps {
  title: ReactNode
  description?: ReactNode
  breadcrumb?: BreadcrumbProps['items']
  /** Force showing breadcrumb even when 2 items (e.g. voluntary `/change-password` under Hồ sơ cá nhân). */
  showBreadcrumb?: boolean
  /** Short labels shown next to the title (e.g. a status Tag). */
  tags?: ReactNode
  /** Page-level actions, primary action last. */
  extra?: ReactNode
}

/**
 * The page head: optional flush-left breadcrumb on Row 1 (`x = 0`), display title with tags on Row 2 (the incipit
 * ornament was dropped, owner 2026-11-24: it read as noise), one-line description below, and actions on the right.
 */
export function PageHeader({ title, description, breadcrumb, showBreadcrumb, tags, extra }: Readonly<PageHeaderProps>) {
  const hasBreadcrumb = Boolean(breadcrumb && (showBreadcrumb ?? breadcrumb.length > 2))

  return (
    <header className="hm-page-head" style={{ marginBottom: spacing.md }}>
      <Flex wrap align="flex-end" justify="space-between" gap={spacing.lg}>
        <div style={{ minWidth: 0, flex: '1 1 auto' }}>
          {hasBreadcrumb && (
            <div style={{ marginBottom: 4 }}>
              <Breadcrumb items={breadcrumb} style={{ fontSize: typography.metadata.fontSize, fontWeight: 500 }} />
            </div>
          )}
          <Flex align="center" wrap gap={spacing.sm} style={{ marginTop: hasBreadcrumb ? 2 : 0 }}>
            <Typography.Title
              level={1}
              style={{
                margin: 0,
                fontFamily: typography.displayFontFamily,
                ...component.pageHeader.title,
                fontVariantNumeric: 'lining-nums',
              }}
            >
              {title}
            </Typography.Title>
            {tags}
          </Flex>
          {description && (
            <Typography.Paragraph
              style={{
                margin: '2px 0 0',
                color: colors.textMuted,
                fontSize: typography.label.fontSize,
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
