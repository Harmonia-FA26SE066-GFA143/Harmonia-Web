import { Button, Table, Typography, type TableColumnsType, type TablePaginationConfig } from 'antd'
import { colors, typography } from '@/styles/tokens'
import type { ReportColumnDefinition } from '../reportDefinitions'
import type { ReportRow } from '../types'

export interface ReportTableProps {
  columns: ReportColumnDefinition[]
  rows: ReportRow[]
  /** Server-side paging. */
  pagination: TablePaginationConfig
  loading?: boolean
  /** Opens the event of a row; the action column is shown only when provided. */
  onOpenProgram?: (programId: string) => void
}

/** Report rows rendered as returned; empty cells show "—". */
export function ReportTable({ columns, rows, pagination, loading, onOpenProgram }: ReportTableProps) {
  const tableColumns: TableColumnsType<ReportRow> = [
    ...columns.map((column) => ({
      key: column.key,
      title: column.title,
      align: column.numeric ? ('right' as const) : undefined,
      render: (_: unknown, row: ReportRow) => {
        const value = row.cells[column.key]
        if (value === undefined || value === '') return <Typography.Text style={{ color: colors.textMuted }}>—</Typography.Text>
        return column.numeric ? (
          <Typography.Text style={{ fontFamily: typography.fontFamilyNumeric, whiteSpace: 'nowrap' }}>{value}</Typography.Text>
        ) : (
          value
        )
      },
    })),
    ...(onOpenProgram
      ? [
          {
            key: 'program-link',
            title: 'Thao tác',
            align: 'right' as const,
            render: (_: unknown, { programId, cells }: ReportRow) =>
              programId && (
                // Every row has this button, so the event is part of its name.
                <Button onClick={() => onOpenProgram(programId)} aria-label={`Xem chương trình ${cells.event ?? ''}`.trim()}>
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
