import { Button, Table, Typography, type TableColumnsType } from 'antd'
import { colors, typography } from '@/styles/tokens'
import type { ReportColumnDefinition } from '../reportDefinitions'
import type { ReportRow } from '../types'

export interface ReportTableProps {
  columns: ReportColumnDefinition[]
  rows: ReportRow[]
  /** Opens the liturgical program of a row; the action column is shown only when provided. */
  onOpenProgram?: (programId: string) => void
}

/** Report rows rendered as returned; empty cells show "—". */
export function ReportTable({ columns, rows, onOpenProgram }: ReportTableProps) {
  const tableColumns: TableColumnsType<ReportRow> = [
    ...columns.map((column) => ({
      key: column.key,
      title: column.title,
      render: (_: unknown, row: ReportRow) => {
        const value = row.cells[column.key]
        if (!value) return <Typography.Text style={{ color: colors.textMuted }}>—</Typography.Text>
        return column.numeric ? (
          <Typography.Text style={{ fontFamily: typography.fontFamilyNumeric, whiteSpace: 'nowrap' }}>
            {value}
          </Typography.Text>
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
            render: (_: unknown, { programId }: ReportRow) =>
              programId && <Button onClick={() => onOpenProgram(programId)}>Xem chương trình</Button>,
          },
        ]
      : []),
  ]

  return (
    <Table<ReportRow>
      rowKey="id"
      columns={tableColumns}
      dataSource={rows}
      pagination={{ pageSize: 10, hideOnSinglePage: true }}
      scroll={{ x: 'max-content' }}
    />
  )
}
