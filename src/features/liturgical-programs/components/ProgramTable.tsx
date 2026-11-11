import { Button, Flex, Table, Typography, type TableColumnsType, type TablePaginationConfig } from 'antd'
import dayjs from 'dayjs'
import { SeasonChip } from '@/shared/ui'
import { colors, typography } from '@/styles/tokens'
import { dueText } from '../programFilters'
import { canEditSongList, type LiturgicalProgram } from '../types'
import { EventStatusTag } from './EventStatusTag'
import { ProgramDateCell } from './ProgramDateCell'
import { SongListStatusTag } from './SongListStatusTag'

export interface ProgramTableProps {
  programs: LiturgicalProgram[]
  /** The program shown in the preview beside the list; a row click picks it. */
  selectedId?: string
  onSelect: (program: LiturgicalProgram) => void
  onOpen: (program: LiturgicalProgram) => void
  onPropose: (program: LiturgicalProgram) => void
  /** Server-side paging of GET /api/liturgical-events. */
  pagination?: TablePaginationConfig | false
  loading?: boolean
  today: string
}

const secondary = { color: colors.textMuted, fontSize: typography.metadata.fontSize }

/**
 * The Choir Director's programs as a dense ruled list (artifact ProgramsPage): the day large, the name over time and
 * place, season, Mass type, song-list state and its due date, and the one action that fits the list's state.
 */
export function ProgramTable({ programs, selectedId, onSelect, onOpen, onPropose, pagination = false, loading, today }: Readonly<ProgramTableProps>) {
  const columns: TableColumnsType<LiturgicalProgram> = [
    {
      key: 'date',
      title: 'Ngày',
      width: 132,
      render: (_, program) => <ProgramDateCell date={program.date} label={dayjs(program.date).format('DD/MM/YYYY')} />,
    },
    {
      key: 'name',
      title: 'Thánh lễ',
      render: (_, program) => (
        <Flex vertical align="start" gap={2}>
          <Typography.Text strong>{program.eventName}</Typography.Text>
          <Typography.Text style={secondary}>{[program.time, program.locationName].filter(Boolean).join(' · ')}</Typography.Text>
        </Flex>
      ),
    },
    {
      key: 'season',
      title: 'Mùa',
      width: 150,
      render: (_, program) => (program.seasonName ? <SeasonChip seasonName={program.seasonName} size="small" /> : <Typography.Text style={secondary}>—</Typography.Text>),
    },
    {
      key: 'type',
      title: 'Loại',
      width: 150,
      render: (_, program) => program.massTypeName ?? program.ceremonyTypeName ?? <Typography.Text style={secondary}>—</Typography.Text>,
    },
    {
      key: 'songList',
      title: 'Danh sách bài hát',
      width: 190,
      render: (_, program) => {
        const due = dueText(program, today)
        return (
          <Flex vertical align="start" gap={2}>
            {program.songListStatus ? <SongListStatusTag status={program.songListStatus} /> : <Typography.Text style={secondary}>Chưa đề xuất</Typography.Text>}
            {due && (
              <Typography.Text style={{ ...secondary, color: due.late ? 'var(--hm-area-attention-ink)' : colors.textMuted, fontWeight: due.late ? 600 : undefined }}>
                {due.text}
              </Typography.Text>
            )}
          </Flex>
        )
      },
    },
    {
      key: 'actions',
      title: <span className="hm-visually-hidden">Thao tác</span>,
      align: 'right',
      width: 120,
      render: (_, program) => {
        // The Choir Director's detail reads published events only (GET /api/schedule/events/{id}).
        if (program.status === 'cancelled') return <EventStatusTag status="cancelled" />
        const propose = canEditSongList(program.songListStatus) && program.date >= today
        return (
          <Button
            type={propose ? 'primary' : 'default'}
            onClick={(event) => {
              event.stopPropagation()
              if (propose) onPropose(program)
              else onOpen(program)
            }}
            aria-label={`${propose ? 'Đề xuất bài hát cho' : 'Xem'} ${program.eventName}`}
          >
            {propose ? 'Đề xuất' : 'Xem'}
          </Button>
        )
      },
    },
  ]

  return (
    <Table<LiturgicalProgram>
      rowKey="id"
      className="hm-table-pick"
      columns={columns}
      dataSource={programs}
      loading={loading}
      pagination={pagination}
      rowClassName={(program) => (program.id === selectedId ? 'is-picked' : '')}
      onRow={(program) => ({ onClick: () => program.status !== 'cancelled' && onSelect(program) })}
      scroll={{ x: 900 }}
    />
  )
}
