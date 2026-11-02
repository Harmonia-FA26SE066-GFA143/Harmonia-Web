import { Flex, Select, Typography } from 'antd'
import dayjs from 'dayjs'
import { generatePath, Link } from 'react-router'
import { paths } from '@/app/router/paths'
import { formatProgramDate, SongListStatusTag, type LiturgicalProgram } from '@/features/liturgical-programs'
import { colors, outcomeColors, sections, spacing, typography } from '@/styles/tokens'
import { participationResponseLabels, type ParticipationResponse } from '../types'

export type ResponseCounts = Record<ParticipationResponse | 'none' | 'sent', number>

const answers: { key: ParticipationResponse | 'none'; label: string; color: string }[] = [
  { key: 'confirmed', label: participationResponseLabels.confirmed.toLowerCase(), color: outcomeColors.good },
  { key: 'unsure', label: participationResponseLabels.unsure.toLowerCase(), color: outcomeColors.late },
  { key: 'declined', label: participationResponseLabels.declined.toLowerCase(), color: outcomeColors.missed },
  { key: 'none', label: 'chưa phản hồi', color: colors.mutedBorder },
]

export interface ResponseHeaderProps {
  program: LiturgicalProgram
  programs: LiturgicalProgram[]
  today: string
  onPick: (programId: string) => void
  /** Absent until requests were sent. */
  counts?: ResponseCounts
}

/**
 * The program the requests are for, as a dated page: its day, name and song list state, the answers so far in one bar
 * with their counts in words, and the picker of the other programs.
 */
export function ResponseHeader({ program, programs, today, onPick, counts }: Readonly<ResponseHeaderProps>) {
  const date = dayjs(program.date)
  const weekday = date.format('dddd')

  return (
    <Flex align="center" gap={spacing.lg} wrap>
      <Flex vertical align="center" style={{ minWidth: 72, paddingInlineEnd: spacing.lg, borderInlineEnd: `1px solid ${colors.border}` }}>
        <Typography.Text style={{ color: colors.textMuted, fontSize: typography.metadata.fontSize }}>
          {weekday.charAt(0).toUpperCase() + weekday.slice(1)}
        </Typography.Text>
        <span style={{ fontFamily: typography.displayFontFamily, fontWeight: 600, fontSize: 52, lineHeight: 1, color: sections.liturgy.cloth, fontVariantNumeric: 'lining-nums' }}>
          {date.format('DD')}
        </span>
        <Typography.Text style={{ color: colors.textMuted, fontSize: typography.metadata.fontSize }}>Tháng {date.month() + 1}</Typography.Text>
      </Flex>
      <Flex vertical gap={2} style={{ flex: '1 1 320px', minWidth: 0 }}>
        <Flex align="center" gap={spacing.sm} wrap>
          <Typography.Title level={2} style={{ margin: 0, fontSize: 18 }}>
            {program.eventName}
          </Typography.Title>
          <SongListStatusTag status={program.songListStatus} />
        </Flex>
        <Typography.Text style={{ color: colors.textMuted }}>
          {formatProgramDate(program.date)} ·{' '}
          <Link to={generatePath(paths.director.programDetail, { programId: program.id })}>Xem chi tiết chương trình</Link>
        </Typography.Text>
        {counts && counts.sent > 0 && (
          <div style={{ marginTop: spacing.md }}>
            <Flex
              role="img"
              aria-label={answers.map(({ key, label }) => `${counts[key]} ${label}`).join(', ')}
              style={{ height: 6, maxWidth: 440, borderRadius: 3, overflow: 'hidden', background: colors.softSurface }}
            >
              {answers.map(({ key, color }) => (counts[key] ? <span key={key} style={{ flex: counts[key], background: color }} /> : null))}
            </Flex>
            <Flex component="ul" wrap gap={spacing.md} style={{ listStyle: 'none', margin: `${spacing.sm}px 0 0`, padding: 0, color: colors.textMuted }}>
              <li>
                <b style={{ color: colors.textPrimary }}>{counts.sent}</b> đã gửi yêu cầu
              </li>
              {answers.map(({ key, label, color }) => (
                <li key={key}>
                  <span aria-hidden style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color, marginInlineEnd: 6 }} />
                  {counts[key]} {label}
                </li>
              ))}
            </Flex>
          </div>
        )}
      </Flex>
      <Flex vertical gap={4} style={{ flex: '0 1 320px', minWidth: 240 }}>
        <label htmlFor="participation-program" style={{ fontSize: typography.metadata.fontSize, color: colors.textMuted }}>
          Chương trình phụng vụ
        </label>
        <Select
          id="participation-program"
          showSearch
          optionFilterProp="label"
          value={program.id}
          onChange={onPick}
          options={programs.map((item) => ({
            value: item.id,
            label: `${item.eventName} · ${formatProgramDate(item.date)}${item.date < today ? ' (đã qua)' : ''}`,
          }))}
        />
      </Flex>
    </Flex>
  )
}
