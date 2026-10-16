import { Button, Flex, Table, Typography, type TableColumnsType, type TablePaginationConfig } from 'antd'
import { colors, typography } from '@/styles/tokens'
import { formatProgramDate } from '../programFilters'
import type { LiturgicalProgram } from '../types'
import { EventStatusTag } from './EventStatusTag'
import { SongListStatusTag } from './SongListStatusTag'

export interface ProgramTableProps {
  programs: LiturgicalProgram[]
  onOpen: (program: LiturgicalProgram) => void
  /** Server-side paging of GET /api/liturgical-events. */
  pagination?: TablePaginationConfig | false
  loading?: boolean
}

const orDash = (name?: string) => name ?? <Typography.Text style={{ color: colors.textMuted }}>—</Typography.Text>

/** Programs of the Choir Director with their catalog names and song-list condition. */
export function ProgramTable({ programs, onOpen, pagination = false, loading }: Readonly<ProgramTableProps>) {
  const columns: TableColumnsType<LiturgicalProgram> = [
    {
      key: 'name',
      title: 'Tên sự kiện',
      render: (_, program) => (
        <Flex vertical align="start" gap={2}>
          <Typography.Text strong>{program.eventName}</Typography.Text>
          {program.status === 'cancelled' && <EventStatusTag status="cancelled" />}
        </Flex>
      ),
    },
    {
      key: 'date',
      title: 'Ngày giờ',
      render: (_, program) => (
        <Typography.Text style={{ fontFamily: typography.fontFamilyNumeric, whiteSpace: 'nowrap' }}>
          {program.time} · {formatProgramDate(program.date)}
        </Typography.Text>
      ),
    },
    { key: 'location', title: 'Nơi cử hành', render: (_, program) => program.locationName },
    { key: 'season', title: 'Mùa phụng vụ', render: (_, program) => orDash(program.seasonName) },
    { key: 'massType', title: 'Loại Thánh lễ', render: (_, program) => orDash(program.massTypeName) },
    { key: 'ceremonyType', title: 'Loại nghi thức', render: (_, program) => orDash(program.ceremonyTypeName) },
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
      loading={loading}
      pagination={pagination}
      scroll={{ x: 'max-content' }}
    />
  )
}
