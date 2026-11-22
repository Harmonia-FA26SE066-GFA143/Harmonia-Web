import { Button, Flex, Table, Typography, type TableColumnsType, type TablePaginationConfig } from 'antd'
import dayjs from 'dayjs'
import { ACTIONS_COLUMN_TITLE, EmptyCell, SeasonChip, StatusTag } from '@/shared/ui'
import { colors, typography } from '@/styles/tokens'
import { dueText } from '../programFilters'
import { canEditSongList, type ProgramListItem } from '../types'
import { EventStatusTag } from './EventStatusTag'
import { SongListStatusTag } from './SongListStatusTag'

export interface ProgramTableProps {
  programs: ProgramListItem[]
  /** The program shown in the preview beside the list; a row click picks it. */
  selectedId?: string
  onSelect: (program: ProgramListItem) => void
  onOpen: (program: ProgramListItem) => void
  onPropose: (program: ProgramListItem) => void
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
  const columns: TableColumnsType<ProgramListItem> = [
    {
      key: 'name',
      title: 'Chương trình',
      // Every column has a width and the layout is fixed, so the sum (892) is the table's floor: it fits the list card
      // beside the preview (916px at 1366, 974px at 1440/1920) and wider cards share the rest in proportion. Earlier
      // floors (`minWidth`) let tags and padding push the table to 1023px and cut the action column (G3-08).
      // The name, type and due text wrap by words; tags keep one line.
      width: 216,
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
      width: 132,
      render: (_, program) => (program.seasonName ? <SeasonChip seasonName={program.seasonName} size="small" /> : <EmptyCell />),
    },
    {
      key: 'type',
      title: 'Loại lễ',
      width: 96,
      render: (_, program) => program.massTypeName ?? program.ceremonyTypeName ?? <EmptyCell />,
    },
    {
      key: 'status',
      title: 'Trạng thái lễ',
      width: 104,
      render: (_, program) => <EventStatusTag status={program.status} />,
    },
    {
      key: 'songList',
      title: 'Danh sách bài hát',
      // The longest tag, "Yêu cầu chỉnh sửa", on one line.
      width: 148,
      render: (_, program) => program.songListStatus ? <SongListStatusTag status={program.songListStatus} /> : <StatusTag mark="draft" style={{ marginInlineEnd: 0 }}>Chưa đề xuất</StatusTag>,
    },
    {
      key: 'due',
      title: 'Hạn đề xuất',
      width: 100,
      render: (_, program) => {
        const due = dueText(program, today)
        if (!due) return <EmptyCell />
        return (
          <Typography.Text style={{ ...secondary, color: due.late ? 'var(--hm-area-attention-ink)' : colors.textMuted, fontWeight: due.late ? 600 : undefined }}>
            {due.text}
          </Typography.Text>
        )
      },
    },
    {
      key: 'actions',
      title: ACTIONS_COLUMN_TITLE,
      align: 'center',
      width: 96,
      render: (_, program) => {
        // The Choir Director's detail reads published events only (GET /api/schedule/events/{id}).
        if (program.status === 'cancelled') return null
        const propose = canEditSongList(program.songListStatus) && program.date >= today
        return (
          <Button
            type="link"
            // The link needs no side padding of its own inside the 96px column; "Đề xuất" stays on one line.
            style={{ paddingInline: 0 }}
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
    <Table<ProgramListItem>
      rowKey="id"
      className="hm-table-pick ct-program-table"
      columns={columns}
      dataSource={programs}
      loading={loading}
      pagination={pagination}
      rowClassName={(program) => (program.id === selectedId ? 'is-picked' : '')}
      onRow={(program) => ({ onClick: () => program.status !== 'cancelled' && onSelect(program) })}
      // The sum of the column widths; below it (never on the desktop widths in scope) the table scrolls inside its card.
      tableLayout="fixed"
      scroll={{ x: 892 }}
    />
  )
}
