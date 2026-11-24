import { Button, Flex, Typography } from 'antd'
import type { ReactNode } from 'react'
import { colors, radius, sizes, spacing } from '@/styles/tokens'
import { FILTER_RESET_LABEL, resultCountLabel } from './glossary'

export interface FilterBarProps {
  children: ReactNode
  /** Inline count shown at right end; while loading (`resultCount === undefined` and not `error`), renders "Đang tải…". */
  resultCount?: number
  /** True when the backing query failed (`isError`), preventing a stuck "Đang tải…" status (R2.5). */
  error?: boolean
  /** Singular noun appended to count, e.g. "bài hát" -> "12 bài hát". */
  resultNoun?: string
  /** True when any filter or search input is currently active. */
  hasActiveFilters: boolean
  onReset: () => void
  /** Optional trailing controls (e.g. view mode Segmented control). */
  extra?: ReactNode
}

/**
 * Unified FilterBar contract (R4.2, R2.5, G2-08, G3-14, G3-15):
 * - Single horizontal wrap-safe row with `40px` unified control height (`sizes.controlHeight`).
 * - Single `"Xoá bộ lọc"` button, disabled when idle (`!hasActiveFilters`).
 * - Inline right-pinned result count (`"Đang tải…"` while loading, `'Không thể tải số liệu'` on error).
 */
export function FilterBar({
  children,
  resultCount,
  error = false,
  resultNoun = 'kết quả',
  hasActiveFilters,
  onReset,
  extra,
}: Readonly<FilterBarProps>) {
  const statusLabel = resultCountLabel(resultCount, resultNoun, error)

  return (
    <Flex
      wrap
      align="center"
      gap={spacing.sm}
      className="hm-filter-bar"
      style={{
        minHeight: sizes.controlHeight,
        padding: `${spacing.sm}px ${spacing.md}px`,
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.lg,
      }}
    >
      {children}
      <Button disabled={!hasActiveFilters} onClick={onReset}>
        {FILTER_RESET_LABEL}
      </Button>
      <Flex align="center" gap={spacing.sm} style={{ marginInlineStart: 'auto' }}>
        <Typography.Text role="status" aria-atomic style={{ color: colors.textMuted, fontSize: 13 }}>
          {statusLabel}
        </Typography.Text>
        {extra}
      </Flex>
    </Flex>
  )
}
