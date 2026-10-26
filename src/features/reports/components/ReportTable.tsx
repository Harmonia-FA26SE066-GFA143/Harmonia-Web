import { Button, Table, Typography, type TableColumnsType, type TablePaginationConfig } from 'antd'
import { colors, typography } from '@/styles/tokens'
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

/** Report rows rendered as returned; counts, dates and times use the numeric font; empty cells show "—". */
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
            <Typography.Text style={{ fontFamily: typography.fontFamilyNumeric, whiteSpace: 'nowrap' }}>{value}</Typography.Text>
          ) : (
            value
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
                  Xem chương trình
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
      scroll={{ x: 'max-content' }}
    />
  )
}
