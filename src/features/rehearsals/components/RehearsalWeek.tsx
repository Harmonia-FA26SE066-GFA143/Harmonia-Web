import { CheckSquareOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { Button, Flex, Typography } from 'antd'
import dayjs from 'dayjs'
import { generatePath, Link } from 'react-router'
import { paths } from '@/app/router/paths'
import type { LiturgicalProgram } from '@/features/liturgical-programs'
import { StatusTag } from '@/shared/ui'
import { colors, radius, sections, spacing, typography } from '@/styles/tokens'
import { rehearsalLabel } from '../rehearsalFormat'
import { isRehearsalDay, isUpcoming, type Rehearsal } from '../types'

export interface RehearsalWeekProps {
  weekStart: string
  /** Which way the week was paged, so it slides in from that side; none on the first view. */
  direction?: 'next' | 'prev'
  rehearsals: Rehearsal[]
  /** Upcoming programs by id; an older program is shown as a link only. */
  programs: Map<string, LiturgicalProgram>
  onOpen: (rehearsal: Rehearsal) => void
  onTakeAttendance: (rehearsal: Rehearsal) => void
  onEdit: (rehearsal: Rehearsal) => void
  onDelete: (rehearsal: Rehearsal) => void
}

const muted = { color: colors.textMuted, fontSize: typography.metadata.fontSize }
const capitalize = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`

/**
 * Where a session stands, read from its times: the BE has no rehearsal status (interpreted, 2026-11-01). Words and a
 * printed mark, never colour alone.
 */
function SessionState({ rehearsal }: Readonly<{ rehearsal: Rehearsal }>) {
  // Neutral tags: the preset hues and the dashed mark already mean approved and draft elsewhere.
  if (!isUpcoming(rehearsal)) return <StatusTag>Đã qua</StatusTag>
  return <StatusTag>{isRehearsalDay(rehearsal) ? 'Hôm nay' : 'Sắp tới'}</StatusTag>
}

function Session({ rehearsal, programs, onOpen, onTakeAttendance, onEdit, onDelete }: Readonly<Omit<RehearsalWeekProps, 'weekStart' | 'direction' | 'rehearsals'> & { rehearsal: Rehearsal }>) {
  const label = rehearsalLabel(rehearsal)
  const program = rehearsal.eventId ? programs.get(rehearsal.eventId) : undefined
  const songs = rehearsal.songs.map((song) => song.songTitle)
  const details = [rehearsal.locationName, songs.length > 0 ? `${songs.length} bài cần tập: ${songs.join(', ')}` : 'Chưa chọn bài tập'].filter(Boolean)

  return (
    <Flex gap={spacing.md} align="stretch">
      {/* The rehearsal cloth marks the session; its state is in words beside the time. */}
      <span aria-hidden style={{ width: spacing.xs, flexShrink: 0, borderRadius: radius.sm, background: isUpcoming(rehearsal) ? sections.rehearsal.cloth : colors.mutedBorder }} />
      <Flex vertical gap={spacing.xs} style={{ flex: 1, minWidth: 0 }}>
        <Flex align="center" gap={spacing.sm} wrap>
          <Typography.Text style={{ fontWeight: 600 }}>
            {dayjs(rehearsal.startAt).format('HH:mm')}–{dayjs(rehearsal.endAt).format('HH:mm')}
          </Typography.Text>
          <SessionState rehearsal={rehearsal} />
        </Flex>
        <Typography.Text>
          {!rehearsal.eventId ? (
            'Không gắn chương trình'
          ) : (
            <Link to={generatePath(paths.director.programDetail, { programId: rehearsal.eventId })}>{program?.eventName ?? 'Xem chương trình'}</Link>
          )}
        </Typography.Text>
        <Typography.Text style={{ ...muted, maxWidth: '72ch' }} ellipsis={{ tooltip: details.join(' · ') }}>
          {details.join(' · ')}
        </Typography.Text>
        {rehearsal.note && (
          <Typography.Text style={{ ...muted, maxWidth: '72ch' }} ellipsis={{ tooltip: rehearsal.note }}>
            {rehearsal.note}
          </Typography.Text>
        )}
      </Flex>
      <Flex align="center" gap={spacing.xs} style={{ flexShrink: 0 }}>
        <Button onClick={() => onOpen(rehearsal)} aria-label={`Xem chi tiết buổi tập ${label}`}>
          Xem chi tiết
        </Button>
        <Button
          type="link"
          icon={<CheckSquareOutlined />}
          onClick={() => onTakeAttendance(rehearsal)}
          aria-label={`${isRehearsalDay(rehearsal) ? 'Điểm danh' : 'Xem điểm danh'} buổi tập ${label}`}
        >
          {isRehearsalDay(rehearsal) ? 'Điểm danh' : 'Xem điểm danh'}
        </Button>
        {/* The backend refuses to edit a session that has ended (REHEARSAL_ALREADY_PASSED). */}
        {isUpcoming(rehearsal) && <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(rehearsal)} aria-label={`Sửa buổi tập ${label}`} />}
        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => onDelete(rehearsal)} aria-label={`Xoá buổi tập ${label}`} />
      </Flex>
    </Flex>
  )
}

/**
 * The week as a timeline (brief 2026-10-31): the seven days in order, each with its sessions by start time; a day
 * without one keeps its line, so the week still reads as a week.
 */
export function RehearsalWeek({ weekStart, direction, rehearsals, ...actions }: Readonly<RehearsalWeekProps>) {
  const start = dayjs(weekStart)
  const days = Array.from({ length: 7 }, (_, index) => start.add(index, 'day'))
  const today = dayjs().format('YYYY-MM-DD')

  return (
    // Keyed by the week, so each new week mounts and slides in.
    <ol
      key={weekStart}
      aria-label="Lịch tập theo tuần"
      className={direction && `hm-week-${direction}`}
      style={{ margin: 0, padding: 0, listStyle: 'none' }}
    >
      {days.map((day) => {
        const key = day.format('YYYY-MM-DD')
        const isToday = key === today
        const items = rehearsals
          .filter((rehearsal) => dayjs(rehearsal.startAt).format('YYYY-MM-DD') === key)
          .toSorted((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt))
        return (
          <li
            key={key}
            aria-label={`${capitalize(day.format('dddd'))} ${day.format('DD/MM')}${isToday ? ', hôm nay' : ''}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '144px minmax(0, 1fr)',
              gap: spacing.lg,
              padding: `${items.length > 0 ? spacing.md : spacing.sm}px ${spacing.md}px`,
              borderTop: `1px solid ${colors.border}`,
            }}
          >
            <div>
              <Typography.Text style={{ display: 'block', fontWeight: isToday ? 600 : 500, color: isToday ? colors.primary : colors.textPrimary }}>
                {capitalize(day.format('dddd'))}
              </Typography.Text>
              <Typography.Text style={muted}>
                {day.format('DD/MM')}
                {isToday && ' · Hôm nay'}
              </Typography.Text>
            </div>
            {items.length === 0 ? (
              <Typography.Text aria-label="Không có buổi tập" style={{ ...muted, alignSelf: 'center' }}>
                —
              </Typography.Text>
            ) : (
              <Flex vertical gap={spacing.md}>
                {items.map((rehearsal) => (
                  <Session key={rehearsal.id} rehearsal={rehearsal} {...actions} />
                ))}
              </Flex>
            )}
          </li>
        )
      })}
    </ol>
  )
}
