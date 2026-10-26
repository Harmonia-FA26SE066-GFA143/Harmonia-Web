import { Card, Typography } from 'antd'
import { useState } from 'react'
import { EmptyState, ErrorState, NoFilterResults, SectionSkeleton } from '@/shared/ui'
import { colors, spacing } from '@/styles/tokens'
import { useReport, useReportColumns } from '../hooks/useReports'
import { reportDefinitions } from '../reportDefinitions'
import type { AdminReportKind, ReportFilters } from '../types'
import { ReportTable } from './ReportTable'

const pageSize = 20

export interface ReportPanelProps {
  kind: AdminReportKind
  filters: ReportFilters
  /** True when a filter is applied, to tell "no results" from "no data". */
  filtered: boolean
  onClearFilters: () => void
  onOpenProgram?: (programId: string) => void
}

/**
 * Loads one report page by page and renders its rows with loading, error, empty and no-result states. The parent
 * remounts it when the filters change (key), which starts again at page 1.
 */
export function ReportPanel({ kind, filters, filtered, onClearFilters, onOpenProgram }: Readonly<ReportPanelProps>) {
  const definition = reportDefinitions[kind]
  const [page, setPage] = useState(1)
  const report = useReport(kind, filters, { pageNumber: page, pageSize })
  const columns = useReportColumns(kind)
  const total = report.data?.totalCount ?? 0
  // The columns matter only once there are rows to show.
  const failed = report.isError || total === 0 || !columns.isError ? report : columns

  if (report.isPending || (total > 0 && columns.isPending)) {
    return <SectionSkeleton rows={6} label={`Đang tải báo cáo ${definition.label.toLowerCase()}`} />
  }
  if (failed.isError) {
    return <ErrorState title="Không thể tải báo cáo" error={failed.error} hasData={report.data !== undefined} onRetry={() => failed.refetch()} retrying={failed.isFetching} />
  }

  return (
    <>
      <Typography.Paragraph style={{ color: colors.textMuted, marginBottom: spacing.md }}>
        {definition.description}
      </Typography.Paragraph>
      {total === 0 && filtered && <NoFilterResults onClearFilters={onClearFilters} />}
      {total === 0 && !filtered && (
        <EmptyState title={definition.emptyTitle} description="Dữ liệu sẽ xuất hiện khi có hoạt động phát sinh." />
      )}
      {total > 0 && (
        <Card styles={{ body: { padding: 0 } }}>
          <ReportTable
            columns={columns.data ?? []}
            rows={report.data?.items ?? []}
            loading={report.isPlaceholderData}
            onOpenProgram={onOpenProgram}
            pagination={{ current: page, pageSize, total, hideOnSinglePage: true, showSizeChanger: false, onChange: setPage }}
          />
        </Card>
      )}
    </>
  )
}
