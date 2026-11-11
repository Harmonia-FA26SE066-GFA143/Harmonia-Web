import { CheckSquareOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { Button, Flex, Typography } from 'antd'
import dayjs from 'dayjs'
import { generatePath, Link } from 'react-router'
import { paths } from '@/app/router/paths'
import { formatProgramDate, type LiturgicalProgram } from '@/features/liturgical-programs'
import { StatusTag } from '@/shared/ui'
import { colors, spacing, typography } from '@/styles/tokens'
import { formatRehearsalTime, rehearsalLabel } from '../rehearsalFormat'
import { isRehearsalDay, isUpcoming, type Rehearsal } from '../types'

export interface RehearsalWeekProps {
  weekStart: string
  /** Which way the week was paged, so it slides in from that side; none on the first view. */
  direction?: 'next' | 'prev'
  rehearsals: Rehearsal[]
  /** Upcoming programs by id; those of this week also show as Mass cards in their day. */
  programs: Map<string, LiturgicalProgram>
  selectedId?: string
  onSelect: (rehearsal: Rehearsal) => void
}

const muted = { color: colors.textMuted, fontSize: typography.metadata.fontSize }
const capitalize = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`
const time = (rehearsal: Rehearsal) => `${dayjs(rehearsal.startAt).format('HH:mm')}–${dayjs(rehearsal.endAt).format('HH:mm')}`

/**
 * Where a session stands, read from its times: the BE has no rehearsal status (interpreted, 2026-11-01). Words and a
 * printed mark, never colour alone.
 */
export function SessionState({ rehearsal }: Readonly<{ rehearsal: Rehearsal }>) {
  if (!isUpcoming(rehearsal)) return <StatusTag>Đã qua</StatusTag>
  return <StatusTag>{isRehearsalDay(rehearsal) ? 'Hôm nay' : 'Sắp tới'}</StatusTag>
}

/**
 * The week as seven columns (artifact RehearsalsPage): a parchment head with the serif day number, today ivory with a
 * burgundy underline; rehearsals are rehearsal-cloth cards that pick the session shown below, and the Mass a week
 * prepares for is a liturgy card in its day.
 */
export function RehearsalWeek({ weekStart, direction, rehearsals, programs, selectedId, onSelect }: Readonly<RehearsalWeekProps>) {
  const start = dayjs(weekStart)
  const days = Array.from({ length: 7 }, (_, index) => start.add(index, 'day'))
  const today = dayjs().format('YYYY-MM-DD')

  return (
    // Keyed by the week, so each new week mounts and slides in from the side it came.
    <ol key={weekStart} aria-label="Lịch tập theo tuần" className={['hm-week', direction && `hm-week-${direction}`].filter(Boolean).join(' ')}>
      {days.map((day) => {
        const key = day.format('YYYY-MM-DD')
        const isToday = key === today
        const items = rehearsals
          .filter((rehearsal) => dayjs(rehearsal.startAt).format('YYYY-MM-DD') === key)
          .toSorted((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt))
        const masses = [...programs.values()].filter((program) => program.date === key)
        return (
          <li key={key} className={`hm-week__day${isToday ? ' is-today' : ''}`} aria-label={`${capitalize(day.format('dddd'))} ${day.format('DD/MM')}${isToday ? ', hôm nay' : ''}`}>
            <div className="hm-week__head" aria-hidden>
              <span>{capitalize(day.format('dd'))}</span>
              <b>{day.format('DD')}</b>
            </div>
            <div className="hm-week__items">
              {items.map((rehearsal) => {
                const program = rehearsal.eventId ? programs.get(rehearsal.eventId) : undefined
                return (
                  <button
                    key={rehearsal.id}
                    type="button"
                    className={`hm-week__card is-rehearsal${isUpcoming(rehearsal) ? '' : ' is-past'}`}
                    aria-pressed={rehearsal.id === selectedId}
                    aria-label={`Buổi tập ${rehearsalLabel(rehearsal)}${program ? `, cho ${program.eventName}` : ''}`}
                    onClick={() => onSelect(rehearsal)}
                  >
                    <b>{time(rehearsal)}</b>
                    <span>{program?.eventName ?? 'Buổi tập'}</span>
                    <small>{rehearsal.songs.length > 0 ? `${rehearsal.songs.length} bài` : 'Chưa chọn bài'}</small>
                  </button>
                )
              })}
              {masses.map((program) => (
                <Link key={program.id} className="hm-week__card is-mass" to={generatePath(paths.director.programDetail, { programId: program.id })}>
                  <b>{program.time}</b>
                  <span>{program.eventName}</span>
                  <small>Thánh lễ</small>
                </Link>
              ))}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export interface RehearsalDetailProps {
  rehearsal: Rehearsal
  program?: LiturgicalProgram
  onOpenRoom: (rehearsal: Rehearsal) => void
  onTakeAttendance: (rehearsal: Rehearsal) => void
  onEdit: (rehearsal: Rehearsal) => void
  onDelete: (rehearsal: Rehearsal) => void
}

/** The picked session under the week, in three columns: when and for which Mass; the songs and their notes; the note and the actions. */
export function RehearsalDetail({ rehearsal, program, onOpenRoom, onTakeAttendance, onEdit, onDelete }: Readonly<RehearsalDetailProps>) {
  const label = rehearsalLabel(rehearsal)
  return (
    <section className="hm-rehearsal-detail" aria-label={`Chi tiết buổi tập ${label}`}>
      <div>
        <p className="hm-rubric">Thời gian và Thánh lễ</p>
        <Flex align="center" gap={spacing.sm} wrap>
          <Typography.Text strong>{formatRehearsalTime(rehearsal)}</Typography.Text>
          <SessionState rehearsal={rehearsal} />
        </Flex>
        {rehearsal.locationName && <Typography.Text style={{ ...muted, display: 'block' }}>{rehearsal.locationName}</Typography.Text>}
        <div style={{ marginTop: spacing.sm }}>
          {rehearsal.eventId ? (
            <Link to={generatePath(paths.director.programDetail, { programId: rehearsal.eventId })}>
              {program ? `${program.eventName} · ${formatProgramDate(program.date)}` : 'Xem chương trình'}
            </Link>
          ) : (
            <Typography.Text style={muted}>Không gắn chương trình</Typography.Text>
          )}
        </div>
      </div>
      <div>
        <p className="hm-rubric">Bài hát · {rehearsal.songs.length}</p>
        {rehearsal.songs.length === 0 ? (
          <Typography.Text style={muted}>Chưa chọn bài tập.</Typography.Text>
        ) : (
          <ol className="hm-preview__songs">
            {rehearsal.songs.map((song, index) => (
              <li key={song.songId} style={{ gridTemplateColumns: '24px minmax(0, 1fr)' }}>
                <span style={muted}>{index + 1}</span>
                <span>
                  {song.songTitle}
                  {song.note && <Typography.Text style={{ ...muted, display: 'block' }}>{song.note}</Typography.Text>}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
      <div>
        <p className="hm-rubric">Ghi chú</p>
        <Typography.Paragraph style={{ marginBottom: spacing.md, whiteSpace: 'pre-line' }}>
          {rehearsal.note ?? <Typography.Text style={muted}>Không có ghi chú.</Typography.Text>}
        </Typography.Paragraph>
        <Flex wrap gap={spacing.sm}>
          <Button type="primary" onClick={() => onOpenRoom(rehearsal)}>
            Vào phòng tập
          </Button>
          <Button icon={<CheckSquareOutlined />} onClick={() => onTakeAttendance(rehearsal)} aria-label={`${isRehearsalDay(rehearsal) ? 'Điểm danh' : 'Xem điểm danh'} buổi tập ${label}`}>
            {isRehearsalDay(rehearsal) ? 'Điểm danh' : 'Xem điểm danh'}
          </Button>
          {/* The backend refuses to edit a session that has ended (REHEARSAL_ALREADY_PASSED). */}
          {isUpcoming(rehearsal) && (
            <Button icon={<EditOutlined />} onClick={() => onEdit(rehearsal)} aria-label={`Sửa buổi tập ${label}`}>
              Sửa
            </Button>
          )}
          <Button danger icon={<DeleteOutlined />} onClick={() => onDelete(rehearsal)} aria-label={`Xoá buổi tập ${label}`}>
            Xoá
          </Button>
        </Flex>
      </div>
    </section>
  )
}
