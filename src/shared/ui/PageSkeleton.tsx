import { Flex, Skeleton } from 'antd'
import { colors, radius, spacing } from '@/styles/tokens'

export interface SectionSkeletonProps {
  /** Number of placeholder rows (e.g. table rows). */
  rows?: number
  /** Accessible label announced to assistive technology. */
  label?: string
}

/** Loading placeholder for one section (table, card group, form) so the rest of the page stays usable. */
export function SectionSkeleton({ rows = 5, label = 'Đang tải dữ liệu' }: SectionSkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      style={{
        padding: spacing.lg,
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.lg,
      }}
    >
      <Skeleton active title={{ width: '30%' }} paragraph={{ rows }} />
    </div>
  )
}

export interface PageSkeletonProps {
  /** Number of section placeholders below the page header. */
  sections?: number
  rows?: number
}

/** Whole-page loading placeholder matching the PageHeader + sections layout. */
export function PageSkeleton({ sections = 2, rows = 4 }: PageSkeletonProps) {
  return (
    <Flex vertical gap={spacing.lg} role="status" aria-busy="true" aria-label="Đang tải trang">
      <Flex vertical gap={spacing.sm}>
        <Skeleton.Input active size="small" style={{ width: 160 }} />
        <Skeleton.Input active size="large" style={{ width: 280 }} />
        <Skeleton.Input active size="small" style={{ width: 360 }} />
      </Flex>
      {Array.from({ length: sections }, (_, index) => (
        <SectionSkeleton key={index} rows={rows} />
      ))}
    </Flex>
  )
}
