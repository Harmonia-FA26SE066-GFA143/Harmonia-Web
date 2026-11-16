import { Button, Flex, Table, Typography, type TableColumnsType, type TablePaginationConfig } from 'antd'
import dayjs from 'dayjs'
import { SeasonChip, StatusTag } from '@/shared/ui'
import { colors, typography } from '@/styles/tokens'
import { dueText } from '../programFilters'
import { canEditSongList, type LiturgicalProgram } from '../types'
import { EventStatusTag } from './EventStatusTag'
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

/** "CN", "T2"…"T7", as the artifact's date blocks print the weekday. */
const weekdayMark = (date: string) => {
  const day = dayjs(date).day()
  return day === 0 ? 'CN' : `T${day + 1}`
}

/**
 * The Choir Director's programs as a dense ruled list (artifact ProgramsPage): the day large, the name over time and
 * place, season, Mass type, song-list state and its due date, and the one action that fits the list's state.
 */
export function ProgramTable({ programs, selectedId, onSelect, onOpen, onPropose, pagination = false, loading, today }: Readonly<ProgramTableProps>) {
  const columns: TableColumnsType<LiturgicalProgram> = [
    {
      key: 'name',
      title: 'Chương trình',
      render: (_, program) => (
        <Flex align="center" gap={12}>
          <span className="hm-date" aria-hidden>
            <b>{dayjs(program.date).format('DD')}</b>
            <span>{weekdayMark(program.date)}</span>
          </span>
          <Flex vertical align="start" gap={2} style={{ minWidth: 0 }}>
            <Typography.Text strong>{program.eventName}</Typography.Text>
            <Typography.Text style={secondary}>
              {[dayjs(program.date).format('DD/MM/YYYY'), program.time, program.locationName].filter(Boolean).join(' · ')}
            </Typography.Text>
          </Flex>
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
      title: 'Loại lễ',
      width: 140,
      render: (_, program) => program.massTypeName ?? program.ceremonyTypeName ?? <Typography.Text style={secondary}>—</Typography.Text>,
    },
    {
      key: 'status',
      title: 'Trạng thái lễ',
      width: 130,
      render: (_, program) => <EventStatusTag status={program.status} />,
    },
    {
      key: 'songList',
      title: 'Danh sách bài hát',
      width: 170,
      render: (_, program) => program.songListStatus ? <SongListStatusTag status={program.songListStatus} /> : <StatusTag mark="draft" style={{ marginInlineEnd: 0 }}>Chưa đề xuất</StatusTag>,
    },
    {
      key: 'due',
      title: 'Hạn đề xuất',
      width: 150,
      render: (_, program) => {
        const due = dueText(program, today)
        if (!due) return <Typography.Text style={secondary}>—</Typography.Text>
        return (
          <Typography.Text style={{ ...secondary, color: due.late ? 'var(--hm-area-attention-ink)' : colors.textMuted, fontWeight: due.late ? 600 : undefined }}>
            {due.text}
          </Typography.Text>
        )
      },
    },
    {
      key: 'actions',
      title: <span className="hm-visually-hidden">Thao tác</span>,
      align: 'center',
      width: 120,
      render: (_, program) => {
        // The Choir Director's detail reads published events only (GET /api/schedule/events/{id}).
        if (program.status === 'cancelled') return null
        const propose = canEditSongList(program.songListStatus) && program.date >= today
        return (
          <Button
            type="link"
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
