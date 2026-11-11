import { Breadcrumb, Flex, Typography, type BreadcrumbProps } from 'antd'
import type { ReactNode } from 'react'
import { colors, component, spacing, typography } from '@/styles/tokens'
import { Incipit } from './ChantStaff'

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
 * The liturgical page head (Harmonia Design System): a short incipit over the title in the display serif, an optional
 * one-line description, actions on the right. The breadcrumb shows only on pages below a section (three levels or more);
 * on a section's own page the running head already says where you are. It enters once when the page opens.
 */
export function PageHeader({ title, description, breadcrumb, tags, extra }: Readonly<PageHeaderProps>) {
  return (
    <header className="hm-page-head" style={{ marginBottom: spacing.md }}>
      <Flex wrap align="flex-end" justify="space-between" gap={spacing.lg}>
        <div style={{ minWidth: 0, flex: '1 1 auto' }}>
          <Flex align="center" gap={spacing.sm + 4}>
            <Incipit />
            {breadcrumb && breadcrumb.length > 2 && (
              <Breadcrumb items={breadcrumb} style={{ fontSize: typography.metadata.fontSize, fontWeight: 500 }} />
            )}
          </Flex>
          <Flex align="center" wrap gap={spacing.sm} style={{ marginTop: 2 }}>
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
