import { Card, Typography } from 'antd'
import { useMemo } from 'react'
import { EmptyState, ErrorState, NoFilterResults, SectionSkeleton } from '@/shared/ui'
import { matchesSearch } from '@/shared/utils/search'
import { colors, spacing } from '@/styles/tokens'
import { useReport } from '../hooks/useReports'
import { reportDefinitions } from '../reportDefinitions'
import type { ReportFilters, ReportKind } from '../types'
import { MetricSummary } from './MetricSummary'
import { ReportTable } from './ReportTable'

export interface ReportPanelProps {
  kind: ReportKind
  filters: ReportFilters
  /** Client-side keyword search across the row values. */
  search?: string
  /** True when any server or client filter is applied, to tell "no results" from "no data". */
  filtered: boolean
  onClearFilters: () => void
  onOpenProgram?: (programId: string) => void
}

/** Loads one report and renders its metrics and rows with loading, error, empty and no-result states. */
export function ReportPanel({ kind, filters, search = '', filtered, onClearFilters, onOpenProgram }: ReportPanelProps) {
  const definition = reportDefinitions[kind]
  const report = useReport(kind, filters)
  const rows = useMemo(
    () => (report.data?.rows ?? []).filter((row) => matchesSearch(search, ...Object.values(row.cells))),
    [report.data, search],
  )

  if (report.isPending) return <SectionSkeleton rows={6} label={`Đang tải báo cáo ${definition.label.toLowerCase()}`} />
  if (report.isError) {
    return <ErrorState title="Không thể tải báo cáo" onRetry={() => report.refetch()} retrying={report.isFetching} />
  }

  return (
    <>
      <Typography.Paragraph style={{ color: colors.textMuted, marginBottom: spacing.md }}>
        {definition.description}
      </Typography.Paragraph>
      <MetricSummary definitions={definition.metrics} values={report.data.metrics} />
      {rows.length === 0 && filtered && <NoFilterResults onClearFilters={onClearFilters} />}
      {rows.length === 0 && !filtered && (
        <EmptyState title={definition.emptyTitle} description="Dữ liệu sẽ xuất hiện khi có hoạt động phát sinh." />
      )}
      {rows.length > 0 && (
        <Card styles={{ body: { padding: 0 } }}>
          <ReportTable columns={definition.columns} rows={rows} onOpenProgram={onOpenProgram} />
        </Card>
      )}
    </>
  )
}
