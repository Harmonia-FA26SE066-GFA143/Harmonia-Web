import { ArrowRightOutlined } from '@ant-design/icons'
import { Button, Typography } from 'antd'
import dayjs from 'dayjs'
import { generatePath, Link, useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { useAllRehearsals } from '@/features/rehearsals'
import { parseUtc, vietnamToday } from '@/lib/api/dates'
import { ErrorState, SectionSkeleton } from '@/shared/ui'

const capitalize = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`

/**
 * This week's rehearsals, Monday to Sunday (artifact DirectorDashboard): the day in the display serif, the hour and the
 * place; today's session stands on the rehearsal tint with the way into its practice room.
 */
export function WeekRehearsals() {
  const navigate = useNavigate()
  const today = dayjs(vietnamToday())
  const monday = today.subtract((today.day() + 6) % 7, 'day')
  const rehearsals = useAllRehearsals({ fromDate: monday.format('YYYY-MM-DD'), toDate: monday.add(6, 'day').format('YYYY-MM-DD') })

  return (
    <section className="hm-sheet-section" aria-labelledby="week-heading">
      <header className="hm-sheet-section__head">
        <h2 id="week-heading" className="hm-rubric">
          Buổi tập tuần này
        </h2>
        <Link to={paths.director.rehearsals} className="hm-sheet-section__link">
          Lịch tập <ArrowRightOutlined aria-hidden />
        </Link>
      </header>
      {rehearsals.isPending && <SectionSkeleton rows={3} label="Đang tải buổi tập tuần này" />}
      {rehearsals.isError && (
        <ErrorState headingLevel={3} title="Không thể tải buổi tập" error={rehearsals.error} hasData={false} onRetry={() => rehearsals.refetch()} retrying={rehearsals.isFetching} />
      )}
      {rehearsals.data?.items.length === 0 && <Typography.Paragraph className="hm-sheet-section__empty">Tuần này chưa có buổi tập nào.</Typography.Paragraph>}
      {rehearsals.data && rehearsals.data.items.length > 0 && (
        <ul className="week-list hm-stagger">
          {rehearsals.data.items.toSorted((a, b) => a.startAt.localeCompare(b.startAt)).map((rehearsal) => {
            const start = dayjs(parseUtc(rehearsal.startAt))
            const isToday = start.isSame(today, 'day')
            const room = generatePath(paths.director.rehearsalDetail, { rehearsalId: rehearsal.id })
            const songs = rehearsal.songs.map((song) => song.songTitle).join(', ')
            return (
              <li key={rehearsal.id} className={isToday ? 'is-today' : undefined}>
                <span className="hm-date" aria-hidden>
                  <b>{start.format('DD')}</b>
                  <span>{capitalize(start.format('dd'))}</span>
                </span>
                <span style={{ minWidth: 0 }}>
                  <Link to={room} className="week-list__time">
                    {isToday ? 'Hôm nay' : capitalize(start.format('dddd'))} · {start.format('HH:mm')}–{dayjs(parseUtc(rehearsal.endAt)).format('HH:mm')}
                  </Link>
                  <span className="week-list__meta">{[rehearsal.locationName, songs].filter(Boolean).join(' · ') || 'Chưa có bài tập'}</span>
                </span>
                {isToday && (
                  <Button type="primary" size="small" href={room} onClick={(event) => { event.preventDefault(); navigate(room) }}>
                    Vào phòng tập
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
