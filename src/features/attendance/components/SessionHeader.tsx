import { Flex, Select, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import type { ReactNode } from 'react'
import { generatePath, Link } from 'react-router'
import { paths } from '@/app/router/paths'
import { formatProgramDate } from '@/features/liturgical-programs'
import { isRehearsalDay, rehearsalLabel, type Rehearsal } from '@/features/rehearsals'
import { colors, sections, spacing, typography } from '@/styles/tokens'

export interface SessionHeaderProps {
  session: Rehearsal
  sessions: Rehearsal[]
  program?: { id: string; eventName: string; date: string }
  onPick: (id: string) => void
  /** The count of the sheet's marks, under the session's details. */
  tally?: ReactNode
}

function timing(session: Rehearsal) {
  if (Date.parse(session.endAt) < Date.now()) return { label: 'Đã qua', background: colors.softSurface, color: colors.textMuted }
  return isRehearsalDay(session)
    ? { label: 'Hôm nay', background: sections.rehearsal.tint, color: sections.rehearsal.ink }
    : { label: 'Sắp tới', background: colors.softSurface, color: colors.textBody }
}

/**
 * The page of the register: the session's day as a large date, its time, place and program, and the picker of the
 * other sessions, with the sheet's count of marks under the details.
 */
export function SessionHeader({ session, sessions, program, onPick, tally }: Readonly<SessionHeaderProps>) {
  const start = dayjs(session.startAt)
  const weekday = start.format('dddd')
  const tag = timing(session)

  return (
    <Flex align="center" gap={spacing.lg} wrap>
      <Flex vertical align="center" style={{ minWidth: 72, paddingInlineEnd: spacing.lg, borderInlineEnd: `1px solid ${colors.border}` }}>
        <Typography.Text style={{ color: colors.textMuted, fontSize: typography.metadata.fontSize }}>
          {weekday.charAt(0).toUpperCase() + weekday.slice(1)}
        </Typography.Text>
        <span style={{ fontFamily: typography.displayFontFamily, fontWeight: 600, fontSize: 52, lineHeight: 1, color: sections.rehearsal.cloth, fontVariantNumeric: 'lining-nums' }}>
          {start.format('DD')}
        </span>
        <Typography.Text style={{ color: colors.textMuted, fontSize: typography.metadata.fontSize }}>Tháng {start.month() + 1}</Typography.Text>
      </Flex>
      <Flex vertical gap={2} style={{ flex: '1 1 320px', minWidth: 0 }}>
        <Flex align="center" gap={spacing.sm} wrap>
          <Typography.Title level={2} style={{ margin: 0, fontSize: 18 }}>
            {[`${start.format('HH:mm')}–${dayjs(session.endAt).format('HH:mm')}`, session.locationName].filter(Boolean).join(' · ')}
          </Typography.Title>
          <Tag bordered={false} style={{ marginInlineEnd: 0, background: tag.background, color: tag.color, fontWeight: 500 }}>
            {tag.label}
          </Tag>
        </Flex>
        <Typography.Text style={{ color: colors.textMuted }}>
          {program ? (
            <>
              Tập cho {program.eventName} · {formatProgramDate(program.date)} ·{' '}
              <Link to={generatePath(paths.director.programDetail, { programId: program.id })}>Xem chương trình</Link>
            </>
          ) : (
            `${start.format('DD/MM/YYYY')} · Không gắn chương trình`
          )}
        </Typography.Text>
        {tally}
      </Flex>
      <Flex vertical gap={4} style={{ flex: '0 1 300px', minWidth: 220 }}>
        <label htmlFor="attendance-session" style={{ fontSize: typography.metadata.fontSize, color: colors.textMuted }}>
          Buổi tập
        </label>
        <Select
          id="attendance-session"
          showSearch
          optionFilterProp="label"
          value={session.id}
          onChange={onPick}
          options={sessions.map((rehearsal) => ({ value: rehearsal.id, label: rehearsalLabel(rehearsal) }))}
        />
      </Flex>
    </Flex>
  )
}
