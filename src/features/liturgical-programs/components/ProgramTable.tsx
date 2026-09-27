import { Button, Table, Typography, type TableColumnsType } from 'antd'
import { colors, typography } from '@/styles/tokens'
import { formatProgramDate } from '../programFilters'
import type { CatalogRef, LiturgicalProgram } from '../types'
import { SongListStatusTag } from './SongListStatusTag'

export interface ProgramTableProps {
  programs: LiturgicalProgram[]
  onOpen: (program: LiturgicalProgram) => void
  pageSize?: number
}

const refText = (ref?: CatalogRef) =>
  ref?.name ?? <Typography.Text style={{ color: colors.textMuted }}>—</Typography.Text>

/** Programs with their FE-16 fields and song-list condition. Shared by the Priest and Choir Director pages. */
export function ProgramTable({ programs, onOpen, pageSize = 10 }: ProgramTableProps) {
  const columns: TableColumnsType<LiturgicalProgram> = [
    {
      key: 'name',
      title: 'Tên sự kiện',
      render: (_, program) => <Typography.Text strong>{program.eventName}</Typography.Text>,
    },
    {
      key: 'date',
      title: 'Ngày',
      render: (_, program) => (
        <Typography.Text style={{ fontFamily: typography.fontFamilyNumeric, whiteSpace: 'nowrap' }}>
          {formatProgramDate(program.date)}
        </Typography.Text>
      ),
    },
    { key: 'season', title: 'Mùa phụng vụ', render: (_, program) => refText(program.season) },
    { key: 'massType', title: 'Loại Thánh lễ', render: (_, program) => refText(program.massType) },
    { key: 'ceremonyType', title: 'Loại nghi thức', render: (_, program) => refText(program.ceremonyType) },
    {
      key: 'songList',
      title: 'Danh sách bài hát',
      render: (_, program) => <SongListStatusTag status={program.songListStatus} />,
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'right',
      render: (_, program) => (
        <Button onClick={() => onOpen(program)} aria-label={`Xem chi tiết ${program.eventName}`}>
          Xem
        </Button>
      ),
    },
  ]

  return (
    <Table<LiturgicalProgram>
      rowKey="id"
      columns={columns}
      dataSource={programs}
      pagination={{ pageSize, hideOnSinglePage: true }}
      scroll={{ x: 'max-content' }}
    />
  )
}
