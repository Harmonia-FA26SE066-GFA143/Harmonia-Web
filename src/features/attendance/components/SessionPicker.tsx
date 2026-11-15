import { Select } from 'antd'
import dayjs from 'dayjs'
import { generatePath, Link } from 'react-router'
import { paths } from '@/app/router/paths'
import { formatProgramDate } from '@/features/liturgical-programs'
import { isRehearsalDay, rehearsalLabel, type Rehearsal } from '@/features/rehearsals'

export interface SessionPickerProps {
  session: Rehearsal
  sessions: Rehearsal[]
  onPick: (id: string) => void
}

/** The session picker at the start of the filter row (artifact AttendancePage). */
export function SessionPicker({ session, sessions, onPick }: Readonly<SessionPickerProps>) {
  return (
    <Select
      aria-label="Buổi tập"
      showSearch
      optionFilterProp="label"
      value={session.id}
      onChange={onPick}
      options={sessions.map((rehearsal) => ({ value: rehearsal.id, label: rehearsalLabel(rehearsal) }))}
      style={{ width: 360, maxWidth: '100%' }}
    />
  )
}

const timing = (session: Rehearsal) =>
  Date.parse(session.endAt) < Date.now() ? 'Đã qua' : isRehearsalDay(session) ? 'Hôm nay' : 'Sắp tới'

/** One line under the page title: when, where, the state from the times, and the program it prepares for. */
export function SessionSummary({ session, program }: Readonly<{ session: Rehearsal; program?: { id: string; eventName: string; date: string } }>) {
  const start = dayjs(session.startAt)
  return (
    <>
      {[`${start.format('DD/MM/YYYY')} · ${start.format('HH:mm')}–${dayjs(session.endAt).format('HH:mm')}`, session.locationName, timing(session)]
        .filter(Boolean)
        .join(' · ')}
      {' · '}
      {program ? (
        <>
          Tập cho {program.eventName} · {formatProgramDate(program.date)} ·{' '}
          <Link to={generatePath(paths.director.programDetail, { programId: program.id })}>Xem chương trình</Link>
        </>
      ) : (
        'Không gắn chương trình'
      )}
    </>
  )
}
