import dayjs from 'dayjs'
import { generatePath, Link } from 'react-router'
import { paths } from '@/app/router/paths'
import { massTimeLabels, massTimeOf, useLiturgicalDays, useNextProgram } from '@/features/liturgical-programs'
import { SeasonChip } from '@/shared/ui'
import type { Surface } from './navigation'

const capitalize = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`

/** The next published Mass from today, for the Priest and the Choir Director (the roles that may list events). */
function NextMass({ surface }: Readonly<{ surface: 'priest' | 'director' }>) {
  const next = useNextProgram()
  if (!next) return null
  const hour = massTimeOf(next.time)
  const to = generatePath(surface === 'director' ? paths.director.programDetail : paths.priest.programDetail, { programId: next.id })
  return (
    <Link to={to} className="hm-head-day__mass" aria-label={`Thánh lễ kế tiếp: ${next.eventName}, ${dayjs(next.date).format('dddd DD/MM')} lúc ${next.time}`}>
      <span className="hm-head-day__label">Kế tiếp</span>
      <span className="hm-head-day__name">{next.eventName}</span>
      <span className="hm-head-day__hour">
        {capitalize(dayjs(next.date).format('dd DD/MM'))} · {hour ? `${massTimeLabels[hour]} ` : ''}
        {next.time}
      </span>
    </Link>
  )
}

/**
 * The right end of the ivory band (artifact Spine): today's season as a chip for every role, and the next Mass with its
 * hour in gilt ink where the role may read events. Nothing while today is not synced; the band never shows an error.
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
