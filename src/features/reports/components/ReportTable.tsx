import { Button, Table, Typography, type TableColumnsType, type TablePaginationConfig } from 'antd'
import { colors } from '@/styles/tokens'
import { dateColumnKeys } from '../reportDefinitions'
import type { ReportColumn, ReportRow } from '../types'

export interface ReportTableProps {
  /** From the backend, in its order. */
  columns: ReportColumn[]
  rows: ReportRow[]
  /** Server-side paging. */
  pagination: TablePaginationConfig
  loading?: boolean
  /** Opens the event of a row; the action column is shown only when provided. */
  onOpenProgram?: (programId: string) => void
}

/** Report rows rendered as returned; counts, dates and times use tabular figures; empty cells show "—". */
export function ReportTable({ columns, rows, pagination, loading, onOpenProgram }: Readonly<ReportTableProps>) {
  const tableColumns: TableColumnsType<ReportRow> = [
    ...columns.map((column) => {
      const numeric = dateColumnKeys.has(column.key) || rows.some((row) => typeof row.cells[column.key] === 'number')
      return {
        key: column.key,
        title: column.title,
        align: numeric ? ('right' as const) : undefined,
        render: (_: unknown, row: ReportRow) => {
          const value = row.cells[column.key]
          if (value === undefined || value === '') return <Typography.Text style={{ color: colors.textMuted }}>—</Typography.Text>
          return numeric ? (
            <Typography.Text style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{value}</Typography.Text>
          ) : (
            // Long text wraps, but never so narrow that a name breaks into single words; short values keep their width.
            <span style={{ display: 'inline-block', minWidth: String(value).length > 12 ? 100 : undefined }}>{value}</span>
          )
        },
      }
    }),
    ...(onOpenProgram
      ? [
          {
            key: 'program-link',
            title: 'Thao tác',
            align: 'right' as const,
            render: (_: unknown, { programId, cells }: ReportRow) =>
              programId && (
                // Every row has this button, so the event is part of its name.
                <Button onClick={() => onOpenProgram(programId)} aria-label={`Xem chương trình ${cells.title ?? ''}`.trim()}>
                  Xem
                </Button>
              ),
          },
        ]
      : []),
  ]

  return (
    <Table<ReportRow>
      rowKey="id"
      columns={tableColumns}
      dataSource={rows}
      loading={loading}
      pagination={pagination}
      // Fits the card, wrapping text and headers; scrolls inside its frame only when the columns cannot fit.
      scroll={{ x: true }}
    />
  )
}
