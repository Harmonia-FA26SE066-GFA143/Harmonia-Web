import type { CSSProperties } from 'react'
import { Flex, Skeleton } from 'antd'
import { colors, radius, spacing } from '@/styles/tokens'
import { StaffPlaceholder } from './ChantStaff'

/** Stagger in ms for the nth block of a page; capped at 180ms like DESIGN.md "Continuity". */
const stagger = (delay: number) => ({ '--hm-delay': `${Math.min(delay, 180)}ms` }) as CSSProperties

export interface SectionSkeletonProps {
  /** Number of placeholder rows (e.g. table rows). */
  rows?: number
  /** Accessible label announced to assistive technology. */
  label?: string
  /** Stagger in ms behind the block before it (PageSkeleton sets it). */
  delay?: number
}

/**
 * Loading placeholder for one section (table, card group, form) so the rest of the page stays usable. It arrives after
 * 100ms (`hm-skeleton-in` in global.css), so a quick answer never flashes it.
 */
export function SectionSkeleton({ rows = 5, label = 'Đang tải dữ liệu', delay = 0 }: Readonly<SectionSkeletonProps>) {
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
}

/** Whole-page loading placeholder matching the PageHeader (serif title, incipit, description) + sections layout. */
export function PageSkeleton({ sections = 2, rows = 4 }: Readonly<PageSkeletonProps>) {
  return (
    <Flex vertical gap={spacing.lg} role="status" aria-busy="true" aria-label="Đang tải trang">
      <Flex vertical gap={spacing.sm} className="hm-skeleton-in">
        <Skeleton.Input active size="large" style={{ width: 300, height: 40 }} />
        <StaffPlaceholder />
        <Skeleton.Input active size="small" style={{ width: 380 }} />
      </Flex>
      {Array.from({ length: sections }, (_, index) => (
        <SectionSkeleton key={index} rows={rows} delay={(index + 1) * 60} />
      ))}
    </Flex>
  )
}
