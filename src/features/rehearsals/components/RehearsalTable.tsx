import { Button, Flex, Table, Tooltip, Typography, type TableColumnsType, type TablePaginationConfig } from 'antd'
import { generatePath, Link } from 'react-router'
import { paths } from '@/app/router/paths'
import { formatProgramDate, type LiturgicalProgram } from '@/features/liturgical-programs'
import { ACTIONS_COLUMN_TITLE, EmptyCell, Icon } from '@/shared/ui'
import { colors, typography } from '@/styles/tokens'
import { formatRehearsalTime, rehearsalLabel } from '../rehearsalFormat'
import { canTakeAttendance, isUpcoming, type Rehearsal } from '../types'
import { JointChip, PlannerOnly } from './JointRehearsal'

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
const none = <EmptyCell />

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
          <div>
            <JointChip rehearsal={rehearsal} />
          </div>
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
            <Typography.Text style={muted}>{formatProgramDate(program.date)}</Typography.Text>
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
          <ol className="ctb-songs ctb-songs--compact">
            {rehearsal.songs.map((song, index) => (
              <li key={song.songId}>
                <span className="ctb-songs__index" aria-hidden>{index + 1}.</span>
                <span>
                  {song.songTitle}
                  {song.note && <Typography.Text style={{ color: colors.textMuted }}> · {song.note}</Typography.Text>}
                </span>
              </li>
            ))}
          </ol>
        ),
    },
    {
      key: 'actions',
      title: ACTIONS_COLUMN_TITLE,
      align: 'center',
      width: 260,
      render: (_, rehearsal) => (
        <Flex justify="center" gap={4}>
          <PlannerOnly rehearsal={rehearsal}>
          <Button
            type="link"
            icon={<Icon name="check-square" />}
            onClick={() => onTakeAttendance(rehearsal)}
            aria-label={`${canTakeAttendance(rehearsal) ? 'Điểm danh' : 'Xem điểm danh'} buổi tập ${rehearsalLabel(rehearsal)}`}
          >
            {canTakeAttendance(rehearsal) ? 'Điểm danh' : 'Xem điểm danh'}
          </Button>
          {/* The backend refuses to edit a session that has ended (REHEARSAL_ALREADY_PASSED). */}
          {isUpcoming(rehearsal) && (
            <Tooltip title="Sửa buổi tập" trigger={['hover', 'focus']}>
              <Button type="text" icon={<Icon name="edit" />} onClick={() => onEdit(rehearsal)} aria-label={`Sửa buổi tập ${rehearsalLabel(rehearsal)}`} />
            </Tooltip>
          )}
          <Tooltip title="Xoá buổi tập" trigger={['hover', 'focus']}>
            <Button
              type="text"
              danger
              icon={<Icon name="delete" />}
              onClick={() => onDelete(rehearsal)}
              aria-label={`Xoá buổi tập ${rehearsalLabel(rehearsal)}`}
            />
          </Tooltip>
          </PlannerOnly>
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
