import type { CSSProperties } from 'react'
import { Flex, Skeleton } from 'antd'
import { colors, radius, spacing } from '@/styles/tokens'

/** Stagger in ms for the nth block of a page; capped at 180ms like DESIGN.md "Continuity". */
const stagger = (delay: number) => ({ '--hm-delay': `${Math.min(delay, 180)}ms` }) as CSSProperties

export interface SectionSkeletonProps {
  /** Number of placeholder rows (e.g. table rows) in list mode, or cards in grid mode. */
  rows?: number
  /** Matches list/table views vs card-grid views (R2.5, G3-02). */
  variant?: 'list' | 'grid'
  /** Accessible label announced to assistive technology. */
  label?: string
  /** Stagger in ms behind the block before it (PageSkeleton sets it). */
  delay?: number
}

/**
 * Loading placeholder matching card-grid geometry (G3-02, R2.5). Zero `opacity: 0` traps.
 */
export function CardGridSkeleton({ cards = 6, label = 'Đang tải danh sách thẻ', delay = 0 }: Readonly<{ cards?: number; label?: string; delay?: number }>) {
  return (
    <output
      aria-busy="true"
      aria-label={label}
      className="hm-skeleton-in"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: spacing.md,
        ...stagger(delay),
      }}
    >
      {Array.from({ length: cards }, (_, index) => (
        <div
          key={index}
          style={{
            padding: spacing.md,
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.lg,
          }}
        >
          <Skeleton active title={{ width: '75%' }} paragraph={{ rows: 2 }} />
        </div>
      ))}
    </output>
  )
}

/**
 * Loading placeholder for one section (table, card group, form) so the rest of the page stays usable.
 */
export function SectionSkeleton({ rows = 5, variant = 'list', label = 'Đang tải dữ liệu', delay = 0 }: Readonly<SectionSkeletonProps>) {
  if (variant === 'grid') return <CardGridSkeleton cards={rows} label={label} delay={delay} />

  return (
    <output
      aria-busy="true"
      aria-label={label}
      className="hm-skeleton-in"
      style={{
        display: 'block',
        padding: spacing.lg,
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.lg,
        ...stagger(delay),
      }}
    >
      <Skeleton active title={{ width: '30%' }} paragraph={{ rows }} />
    </output>
  )
}

export interface PageSkeletonProps {
  /** Number of section placeholders below the page header. */
  sections?: number
  rows?: number
  variant?: 'list' | 'grid'
}

/** Whole-page loading placeholder matching the PageHeader (title, description) + sections layout. */
export function PageSkeleton({ sections = 2, rows = 4, variant = 'list' }: Readonly<PageSkeletonProps>) {
  return (
    <Flex vertical gap={spacing.lg} role="status" aria-busy="true" aria-label="Đang tải trang">
      <Flex vertical gap={spacing.sm} className="hm-skeleton-in">
        <Skeleton.Input active size="large" style={{ width: 300, height: 40 }} />
        <Skeleton.Input active size="small" style={{ width: 380 }} />
      </Flex>
      {Array.from({ length: sections }, (_, index) => (
        <SectionSkeleton key={index} rows={rows} variant={variant} delay={(index + 1) * 60} />
      ))}
    </Flex>
  )
}
