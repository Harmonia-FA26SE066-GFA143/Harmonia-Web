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

const secondary = { color: colors.textMuted, fontSize: typography.metadata.fontSize }

// Mass or ceremony type and season under the name, so the table fits without scrolling sideways. An untitled
// program is already named after its type, which is then not repeated.
const classification = ({ eventName, massTypeName, ceremonyTypeName, seasonName }: LiturgicalProgram) =>
  [massTypeName, ceremonyTypeName, seasonName].filter((name) => name && name !== eventName).join(' · ')

/** Programs of the Choir Director with their catalog names and song-list condition. */
export function ProgramTable({ programs, onOpen, pagination = false, loading }: Readonly<ProgramTableProps>) {
  const columns: TableColumnsType<LiturgicalProgram> = [
    {
      key: 'name',
      title: 'Tên sự kiện',
      render: (_, program) => (
        <Flex vertical align="start" gap={2}>
          <Typography.Text strong>{program.eventName}</Typography.Text>
          {classification(program) && <Typography.Text style={secondary}>{classification(program)}</Typography.Text>}
          {program.status === 'cancelled' && <EventStatusTag status="cancelled" />}
        </Flex>
      ),
    },
    {
      key: 'date',
      title: 'Ngày giờ',
      render: (_, program) => (
        <Typography.Text style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
          {program.time} · {formatProgramDate(program.date)}
        </Typography.Text>
      ),
    },
    { key: 'location', title: 'Nơi cử hành', render: (_, program) => program.locationName },
    {
      key: 'songList',
      title: 'Danh sách bài hát',
      width: 170,
      fixed: 'right',
      render: (_, program) => <SongListStatusTag status={program.songListStatus} />,
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'right',
      fixed: 'right',
      render: (_, program) =>
        // The Choir Director's detail reads published events only (GET /api/schedule/events/{id}), so a cancelled one
        // would open on "not found".
        program.status === 'cancelled' ? (
          <Typography.Text style={secondary}>Không xem được</Typography.Text>
        ) : (
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
