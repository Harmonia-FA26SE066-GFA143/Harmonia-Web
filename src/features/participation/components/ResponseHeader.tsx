import { Flex, Select, Typography } from 'antd'
import dayjs from 'dayjs'
import { generatePath, Link } from 'react-router'
import { paths } from '@/app/router/paths'
import { formatProgramDate, SongListStatusTag, type LiturgicalProgram } from '@/features/liturgical-programs'
import { SummaryStrip } from '@/shared/ui'
import { colors, sections, spacing, typography } from '@/styles/tokens'
import { participationResponseLabels, type ParticipationResponse } from '../types'

export type ResponseCounts = Record<ParticipationResponse | 'none' | 'sent', number>

// Spec order: Xác nhận, Từ chối, Chưa chắc; "Chưa phản hồi" is the waiting cell.
const answers: { key: ParticipationResponse; label: string }[] = [
  { key: 'confirmed', label: participationResponseLabels.confirmed },
  { key: 'declined', label: participationResponseLabels.declined },
  { key: 'unsure', label: participationResponseLabels.unsure },
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
            <SummaryStrip
              label={`Phản hồi trên ${counts.sent} yêu cầu đã gửi`}
              cells={[
                ...answers.map(({ key, label }) => ({ label, value: counts[key] })),
                { label: 'Chưa phản hồi', value: counts.none, waiting: 'Còn chờ' },
              ]}
            />
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
