import { Flex, Popover, Typography } from 'antd'
import dayjs from 'dayjs'
import { generatePath, Link } from 'react-router'
import { paths } from '@/app/router/paths'
import { massTimeLabels, massTimeOf, useLiturgicalDays, useNextProgram } from '@/features/liturgical-programs'
import { SeasonChip } from '@/shared/ui'
import { getPopupContainer } from '@/shared/ui/popupContainer'
import { colors, spacing } from '@/styles/tokens'
import type { Surface } from './navigation'

const capitalize = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`

/** The next published Mass from today, for the Priest and the Choir Director (the roles that may list events). */
function NextMass({ surface }: Readonly<{ surface: 'priest' | 'director' }>) {
  const next = useNextProgram()
  if (!next) return null
  const hour = massTimeOf(next.time)
  const to = generatePath(surface === 'director' ? paths.director.programDetail : paths.priest.programDetail, { programId: next.id })
  const compactDate = `${capitalize(dayjs(next.date).format('dd DD/MM'))} · ${next.time}`
  const detailContent = (
    <Flex vertical gap={spacing.xs} style={{ maxWidth: 260 }}>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        Thánh lễ kế tiếp
      </Typography.Text>
      <Typography.Text strong style={{ color: colors.textPrimary }}>
        {next.eventName}
      </Typography.Text>
      <Typography.Text style={{ fontSize: 13, color: colors.textBody }}>
        {capitalize(dayjs(next.date).format('dddd, DD/MM/YYYY'))} · {hour ? `${massTimeLabels[hour]} ` : ''}
        {next.time}
      </Typography.Text>
    </Flex>
  )

  return (
    <Popover trigger={['hover', 'focus']} placement="bottomRight" getPopupContainer={getPopupContainer} content={detailContent}>
      <Link
        to={to}
        className="hm-head-day__mass"
        aria-label={`Thánh lễ kế tiếp: ${next.eventName}, ${dayjs(next.date).format('dddd DD/MM')} lúc ${next.time}`}
      >
        <span className="hm-head-day__hour">{compactDate}</span>
      </Link>
    </Popover>
  )
}

/**
 * The right end of the ivory band (artifact Spine): today's season as a chip for every role, and the next Mass as a
 * compact pill (`dd DD/MM · HH:mm`) with a hover popover showing full details.
 */
export function HeadDay({ surface }: Readonly<{ surface?: Surface }>) {
  const today = dayjs().format('YYYY-MM-DD')
  const day = useLiturgicalDays(today, today).data?.get(today)
  return (
    <div className="hm-head-day">
      {day?.seasonName && <SeasonChip seasonName={day.seasonName} seasonKey={day.seasonKey} color={day.color} size="small" />}
      {(surface === 'priest' || surface === 'director') && <NextMass surface={surface} />}
    </div>
  )
}
