import { ArrowRightOutlined } from '@ant-design/icons'
import { Button, Typography } from 'antd'
import dayjs from 'dayjs'
import { generatePath, Link, useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import {
  massTimeLabels,
  massTimeOf,
  preparationItems,
  SongListStatusTag,
  usePreparationStatus,
  type LiturgicalProgram,
  type PreparationItem,
} from '@/features/liturgical-programs'
import { SectionSkeleton } from '@/shared/ui'

const capitalize = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`

/** Where each preparation item is worked on, and the words of the button that goes there. */
function itemAction(program: LiturgicalProgram, label: string) {
  const songList = generatePath(paths.director.songListProposal, { programId: program.id })
  const actions: Record<string, { to: string; text: string }> = {
    'Danh sách bài hát': { to: songList, text: program.songListStatus ? 'Mở danh sách bài hát' : 'Đề xuất danh sách bài hát' },
    'Cha xứ duyệt': { to: songList, text: 'Xem danh sách bài hát' },
    'Xác nhận tham gia': { to: paths.director.participation, text: 'Mở xác nhận tham gia' },
    'Chốt phân công': { to: `${paths.director.roster}?programId=${program.id}`, text: 'Mở phân công' },
    Tập: { to: paths.director.rehearsals, text: 'Mở lịch tập' },
  }
  return actions[label]
}

// What waits on the Director goes first among the open items; the list itself keeps its fixed reading order.
const urgency = { waiting: 0, todo: 1, progress: 2, done: 3 } as const

/** One preparation signal: its name and its value in words; a shortage is a dashed mark, never red. */
function Signal({ item }: Readonly<{ item: PreparationItem }>) {
  return (
    <li>
      <span>{item.label}</span>
      <span className={`hm-signal is-${item.state}`}>{item.value}</span>
    </li>
  )
}

/**
 * The next Mass beside the overview (artifact DirectorDashboard): the evening head on the bookcloth with the day in the
 * display serif, the preparation signals as independent rows (no steps, no numbers, no progress bar), a shortage per
 * voice part as a dashed mark, then the one primary for what is due next.
 */
export function NextMassPanel({ program }: Readonly<{ program: LiturgicalProgram }>) {
  const navigate = useNavigate()
  const prep = usePreparationStatus(program.id)
  const date = dayjs(program.date)
  const hour = massTimeOf(program.time)
  // The celebration is a date, not a job.
  const items = preparationItems({ date: program.date, songListStatus: program.songListStatus, status: prep.data, failed: prep.isError, viewer: 'director' }).filter(
    (item) => item.label !== 'Cử hành',
  )
  const next = items.filter((item) => item.state !== 'done').sort((a, b) => urgency[a.state] - urgency[b.state])[0]
  const action = next && itemAction(program, next.label)
  const shortages = prep.data?.rosterShortages ?? []

  return (
    <section className="next-mass" aria-labelledby="next-mass-heading">
      <div className="next-mass__head mass-time-dark">
        <span className="next-mass__day" aria-hidden>
          {date.format('DD')}
        </span>
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
      <div className="next-mass__body">
        <h3 className="hm-rubric">Tình hình chuẩn bị</h3>
        {prep.isPending ? (
          <SectionSkeleton rows={4} label="Đang tải tình hình chuẩn bị" />
        ) : (
          <>
            {prep.isError && (
              <Typography.Paragraph type="danger" style={{ margin: '0 0 8px' }}>
                Không thể tải tình hình chuẩn bị.{' '}
                <Button size="small" onClick={() => prep.refetch()} loading={prep.isFetching}>
                  Thử lại
                </Button>
              </Typography.Paragraph>
            )}
            <ul className="next-mass__signals hm-stagger" aria-label="Các mục chuẩn bị">
              {items.map((item) => (
                <Signal key={item.label} item={item} />
              ))}
            </ul>
            {shortages.length > 0 && (
              <ul className="next-mass__shortages" aria-label="Vị trí còn thiếu">
                {shortages.map((shortage) => (
                  <li key={`${shortage.skillName}-${shortage.songTitle ?? ''}`} className="hm-missing">
                    Thiếu {shortage.requiredCount - shortage.assignedCount} {shortage.skillName}
                    {shortage.songTitle ? ` · ${shortage.songTitle}` : ''}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
        {action ? (
          <Button type="primary" block href={action.to} onClick={(event) => { event.preventDefault(); navigate(action.to) }}>
            {action.text}
          </Button>
        ) : (
          <Typography.Text className="next-mass__ready">Đã đủ mọi mục cho Thánh lễ này.</Typography.Text>
        )}
        <Link to={generatePath(paths.director.programDetail, { programId: program.id })} className="next-mass__more">
          Xem chương trình <ArrowRightOutlined aria-hidden />
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
