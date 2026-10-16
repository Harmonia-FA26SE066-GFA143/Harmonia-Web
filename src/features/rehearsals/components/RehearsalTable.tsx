import { CheckSquareOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { Button, Flex, Table, Typography, type TableColumnsType, type TablePaginationConfig } from 'antd'
import { generatePath, Link } from 'react-router'
import { paths } from '@/app/router/paths'
import { formatProgramDate, type LiturgicalProgram } from '@/features/liturgical-programs'
import { colors, typography } from '@/styles/tokens'
import { formatRehearsalTime, rehearsalLabel } from '../rehearsalFormat'
import { isRehearsalDay, isUpcoming, type Rehearsal } from '../types'

export interface RehearsalTableProps {
  rehearsals: Rehearsal[]
  /** Upcoming programs by id; an older program is shown as a link only. */
  programs: Map<string, LiturgicalProgram>
  pagination: TablePaginationConfig
  loading?: boolean
  onTakeAttendance: (rehearsal: Rehearsal) => void
  onEdit: (rehearsal: Rehearsal) => void
  onDelete: (rehearsal: Rehearsal) => void
}

const muted = { color: colors.textMuted, fontSize: typography.metadata.fontSize }
const none = <Typography.Text style={{ color: colors.textMuted }}>—</Typography.Text>

export function RehearsalTable({
  rehearsals,
  programs,
  pagination,
  loading,
  onTakeAttendance,
  onEdit,
  onDelete,
}: Readonly<RehearsalTableProps>) {
  const columns: TableColumnsType<Rehearsal> = [
    {
      key: 'time',
      title: 'Thời gian & địa điểm',
      render: (_, rehearsal) => (
        <Flex vertical gap={2}>
          <Typography.Text strong>{formatRehearsalTime(rehearsal)}</Typography.Text>
          {rehearsal.locationName && <Typography.Text style={muted}>{rehearsal.locationName}</Typography.Text>}
          {rehearsal.note && (
            <Typography.Text style={muted} ellipsis={{ tooltip: rehearsal.note }}>
              {rehearsal.note}
            </Typography.Text>
          )}
        </Flex>
      ),
    },
    {
      key: 'program',
      title: 'Chương trình phụng vụ',
      render: (_, rehearsal) => {
        if (!rehearsal.eventId) return none
        const program = programs.get(rehearsal.eventId)
        const link = generatePath(paths.director.programDetail, { programId: rehearsal.eventId })
        return program ? (
          <Flex vertical gap={2}>
            <Link to={link}>{program.eventName}</Link>
            <Typography.Text style={{ ...muted, fontFamily: typography.fontFamilyNumeric }}>{formatProgramDate(program.date)}</Typography.Text>
          </Flex>
        ) : (
          <Link to={link}>Xem chương trình</Link>
        )
      },
    },
    {
      key: 'songs',
      title: 'Bài hát tập',
      render: (_, rehearsal) =>
        rehearsal.songs.length === 0 ? (
          none
        ) : (
          <ul style={{ margin: 0, paddingInlineStart: 18 }}>
            {rehearsal.songs.map((song) => (
              <li key={song.songId}>{song.songTitle}</li>
            ))}
          </ul>
        ),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'right',
      render: (_, rehearsal) => (
        <Flex justify="flex-end" gap={4}>
          <Button type="link" icon={<CheckSquareOutlined />} onClick={() => onTakeAttendance(rehearsal)}>
            {isRehearsalDay(rehearsal) ? 'Điểm danh' : 'Xem điểm danh'}
          </Button>
          {/* The backend refuses to edit a session that has ended (REHEARSAL_ALREADY_PASSED). */}
          {isUpcoming(rehearsal) && (
            <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(rehearsal)} aria-label={`Sửa buổi tập ${rehearsalLabel(rehearsal)}`} />
          )}
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDelete(rehearsal)}
            aria-label={`Xoá buổi tập ${rehearsalLabel(rehearsal)}`}
          />
        </Flex>
      ),
    },
  ]

  return (
    <Table<Rehearsal>
      rowKey="id"
      columns={columns}
      dataSource={rehearsals}
      loading={loading}
      pagination={pagination}
      scroll={{ x: 900 }}
    />
  )
}
