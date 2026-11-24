import { Button } from 'antd'
import dayjs from 'dayjs'
import { generatePath, Link, useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import {
  massTimeLabels,
  massTimeOf,
  MassTimeMark,
  SongListStatusTag,
  usePreparationStatus,
  type LiturgicalProgram,
  type ProgramListItem,
} from '@/features/liturgical-programs'
import { ChantStaff, ErrorState, Icon } from '@/shared/ui'
import { gold } from '@/styles/tokens'
import { preparationSteps, type PreparationStep } from './preparationSteps'

const capitalize = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`

// What waits on the Director goes first among the open steps; the timeline itself keeps its fixed reading order.
const urgency = { waiting: 0, todo: 1, progress: 2, done: 3 } as const

/** One step of the timeline: its marker on the rule, its name (the way to the page where it is done) and its value. */
function TimelineStep({ step }: Readonly<{ step: PreparationStep }>) {
  return (
    <li className={`prep-step is-${step.state}`}>
      <span className="prep-step__marker" aria-hidden>
        <Icon name={step.state === 'done' ? 'check' : step.icon} />
      </span>
      <div className="prep-step__body">
        <div className="prep-step__head">
          <Link to={step.to} className="prep-step__title">
            {step.title} <Icon name="arrow-right" className="prep-step__arrow" />
          </Link>
          <span className={`hm-signal is-${step.state}`}>{step.value}</span>
        </div>
        {step.detail && <div className="prep-step__detail">{step.detail}</div>}
        {step.links?.map((link) => (
          <Link key={link.to} to={link.to} className="prep-step__link">
            {link.text}
          </Link>
        ))}
      </div>
    </li>
  )
}

/**
 * The next Mass beside the overview, Signature Screen #1 ("Chúa nhật này đã sẵn sàng chưa?"): the evening head on the
 * bookcloth with the day in the display serif, then the five preparation steps on one rule, each linking to the page
 * where it is done, and the one primary for the most urgent open step. The program's identity and song-list step need
 * only the list row, so they stand while the preparation status loads or fails.
 */
export function NextMassPanel({ program, reviewCount }: Readonly<{ program: ProgramListItem; reviewCount?: number }>) {
  const navigate = useNavigate()
  const prep = usePreparationStatus(program.id)
  const date = dayjs(program.date)
  const hour = massTimeOf(program.time)
  const steps = preparationSteps({ program, status: prep.data, failed: prep.isError, reviewCount })
  // Without the counts only the song-list step is known; an unknown step never becomes the primary action.
  const known = prep.data ? steps : steps.slice(0, 1)
  const next = known.filter((step) => step.state !== 'done').sort((a, b) => urgency[a.state] - urgency[b.state])[0]

  return (
    <section className="next-mass" aria-labelledby="next-mass-heading">
      <div className="next-mass__head mass-time-dark hm-mass-host">
        {/* The hour of the Mass in its arch (Figma "Sáng – Chiều – Tối"), in place of the day number the line beside repeats. */}
        <div className="next-mass__top">
          {hour && <MassTimeMark time={hour} color={gold.soft} style={{ flexShrink: 0 }} />}
          <div style={{ minWidth: 0 }}>
            <span className="next-mass__when">
              {hour ? `${massTimeLabels[hour]} · ` : ''}
              {capitalize(date.format('dddd DD/MM/YYYY'))} · {program.time}
            </span>
            <h2 id="next-mass-heading" className="next-mass__name">
              {program.eventName}
            </h2>
            <span className="next-mass__where">{program.locationName}</span>
          </div>
        </div>
        {/* The arch stands on a chant staff ruled the width of the head, the phrase at its end (as on the program page's
            head). Decoration, hidden from readers. */}
        <div className="next-mass__staff" aria-hidden>
          <span className="next-mass__staff-run" />
          <ChantStaff color={gold.soft} />
        </div>
      </div>
      <div className="next-mass__body">
        {/* The question the screen answers; "Chúa nhật" only when the Mass falls on a Sunday. */}
        <h3 className="hm-rubric">{date.day() === 0 ? 'Chúa nhật này đã sẵn sàng chưa?' : 'Thánh lễ này đã sẵn sàng chưa?'}</h3>
        {prep.isError && (
          <ErrorState
            headingLevel={3}
            title="Không thể tải tình hình chuẩn bị"
            error={prep.error}
            hasData={prep.data !== undefined}
            onRetry={() => prep.refetch()}
            retrying={prep.isFetching}
          />
        )}
        <ol className="prep-timeline" aria-label="Các mục chuẩn bị" aria-busy={prep.isPending || undefined}>
          {steps.map((step) => (
            <TimelineStep key={step.key} step={step} />
          ))}
        </ol>
        {next ? (
          <Button type="primary" block href={next.to} onClick={(event) => { event.preventDefault(); navigate(next.to) }}>
            {next.action}
          </Button>
        ) : (
          prep.data && <span className="next-mass__ready">Đã đủ mọi mục cho Thánh lễ này.</span>
        )}
        <Link to={generatePath(paths.director.programDetail, { programId: program.id })} className="next-mass__more">
          Xem chương trình <Icon name="arrow-right" />
        </Link>
      </div>
    </section>
  )
}

/** The Masses after the next one, side by side in four columns with their date in the display serif. */
export function UpcomingStrip({ programs }: Readonly<{ programs: LiturgicalProgram[] }>) {
  return (
    <ul className="upcoming-strip hm-stagger">
      {programs.map((program) => {
        const date = dayjs(program.date)
        const hour = massTimeOf(program.time)
        return (
          <li key={program.id}>
            <Link to={generatePath(paths.director.programDetail, { programId: program.id })} className="upcoming-strip__item">
              <span className="hm-date" aria-hidden>
                <b>{date.format('DD')}</b>
                <span>T{date.format('M')}</span>
              </span>
              <span style={{ minWidth: 0 }}>
                <span className="upcoming-strip__name">{program.eventName}</span>
                <span className="upcoming-strip__meta">
                  {capitalize(date.format('dd DD/MM'))} · {hour ? `${massTimeLabels[hour]} ` : ''}
                  {program.time}
                </span>
                {program.songListStatus ? <SongListStatusTag status={program.songListStatus} /> : <span className="upcoming-strip__meta">Chưa có danh sách bài hát</span>}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
