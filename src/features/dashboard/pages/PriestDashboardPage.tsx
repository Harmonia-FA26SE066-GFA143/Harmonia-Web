import { PlusOutlined } from '@ant-design/icons'
import { Button, Flex, Skeleton, Typography } from 'antd'
import dayjs from 'dayjs'
import type { CSSProperties, ReactNode } from 'react'
import { generatePath, Link, useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { EventStatusTag, formatProgramDate, useEvent, useEventNames, useEvents } from '@/features/liturgical-programs'
import { usePendingSongLists } from '@/features/song-list-review'
import { parseUtc, vietnamToday } from '@/lib/api/dates'
import { AllDone, EmptyState, EmptyWeek, ErrorState, PageHeader, SectionSkeleton } from '@/shared/ui'
import { TodaySeason } from '../components/TodaySeason'

const upcomingLimit = 5
const order = (index: number) => ({ '--i': index }) as CSSProperties

/** A submitted list, named after its event (the pending lists carry only the event id). */
function PendingSongList({ eventId, version, submittedAt }: Readonly<{ eventId: string; version: number; submittedAt?: string }>) {
  const navigate = useNavigate()
  const event = useEvent(eventId)
  const { eventName } = useEventNames()
  const label = event.data ? `${eventName(event.data)} · ${formatProgramDate(event.data.date)}` : 'Sự kiện phụng vụ'

  return (
    <>
      {event.isPending ? (
        // Keeps the title's place so the row does not jump when the event name arrives.
        <output aria-label="Đang tải tên sự kiện">
          <Skeleton.Input active size="small" />
        </output>
      ) : (
        <Typography.Text strong>{label}</Typography.Text>
      )}
      <span className="week-list__meta">
        Ca trưởng gửi phiên bản {version}
        {submittedAt && ` lúc ${dayjs(parseUtc(submittedAt)).format('HH:mm DD/MM/YYYY')}`}
      </span>
      {/* Every row has this button, so the event is part of its name. */}
      <Button
        type="primary"
        aria-label={`Xem danh sách bài hát: ${label}`}
        onClick={() => navigate(generatePath(paths.priest.songListReview, { programId: eventId }))}
      >
        Xem danh sách bài hát
      </Button>
    </>
  )
}

/** A sheet opened by a rubric, as on the Choir Director's overview. */
function Section({
  id,
  title,
  extra,
  className = 'hm-sheet-section',
  children,
}: Readonly<{ id: string; title: string; extra?: ReactNode; className?: string; children: ReactNode }>) {
  return (
    <section aria-labelledby={id} className={className}>
      <header className="hm-sheet-section__head">
        <h2 id={id} className="hm-rubric">
          {title}
        </h2>
        {extra}
      </header>
      {children}
    </section>
  )
}

/**
 * Priest dashboard (Pattern 4, Dashboard / Overview; artifact PriestDashboard): today's season and the upcoming
 * liturgical events from `GET /api/liturgical-events` (FE-15) as a ruled list, beside what waits on the Priest: the
 * song lists Ca trưởng submitted, from `GET /api/song-lists/pending` (FE-17), on the reading surface. Each part loads
 * and fails on its own; reports (FE-22) are in the running head.
 */
export function PriestDashboardPage() {
  const navigate = useNavigate()
  const upcoming = useEvents({ fromDate: vietnamToday() }, { pageNumber: 1, pageSize: upcomingLimit })
  const pending = usePendingSongLists()
  const { name, eventName } = useEventNames()
  const lists = pending.data ?? []

  const createButton = (
    <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(paths.priest.programCreate)}>
      Tạo chương trình
    </Button>
  )

  return (
    <div className="director-dashboard-page">
      <PageHeader title="Tổng quan" breadcrumb={[{ title: 'Cha xứ' }, { title: 'Tổng quan' }]} extra={createButton} />
      <div className="dash-grid">
        <div className="dash-main">
          <TodaySeason />
          <Section
            id="upcoming-heading"
            title="Sự kiện sắp tới"
            extra={
              <Flex align="center" gap={12}>
                {upcoming.data && upcoming.data.totalCount > 0 && <span className="week-list__meta">{upcoming.data.totalCount} sự kiện</span>}
                <Link to={paths.priest.programs} className="hm-sheet-section__link">
                  Tất cả chương trình
                </Link>
              </Flex>
            }
          >
            {upcoming.isPending && <SectionSkeleton rows={upcomingLimit} label="Đang tải sự kiện sắp tới" />}
            {upcoming.isError && (
              <ErrorState headingLevel={3} title="Không thể tải sự kiện sắp tới" error={upcoming.error} hasData={upcoming.data !== undefined} onRetry={() => upcoming.refetch()} retrying={upcoming.isFetching} />
            )}
            {upcoming.data !== undefined && upcoming.data.totalCount === 0 && (
              <EmptyState
                headingLevel={3}
                icon={<EmptyWeek />} title="Chưa có sự kiện sắp tới"
                description="Tạo và công bố sự kiện phụng vụ để Ca trưởng bắt đầu chuẩn bị."
                action={createButton}
              />
            )}
            {upcoming.data !== undefined && upcoming.data.totalCount > 0 && (
              <ul className="week-list priest-events hm-stagger">
                {upcoming.data.items.map((event, index) => {
                  const title = eventName(event)
                  const date = dayjs(event.date)
                  return (
                    <li key={event.id} style={order(index)}>
                      <span className="hm-date">
                        <b>{date.format('DD')}</b>
                        <span>Th {date.format('M')}</span>
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <span className="week-list__time">{title}</span>
                        <span className="week-list__meta">{[event.time, event.locationName, name('season', event.seasonId)].filter(Boolean).join(' · ')}</span>
                      </span>
                      <EventStatusTag status={event.status} />
                      <Button
                        onClick={() => navigate(generatePath(paths.priest.programDetail, { programId: event.id }))}
                        aria-label={`Xem chi tiết ${title} ngày ${formatProgramDate(event.date)}`}
                      >
                        Xem
                      </Button>
                    </li>
                  )
                })}
              </ul>
            )}
          </Section>
        </div>

        <aside className="dash-aside" aria-label="Việc chờ Cha xứ">
          <Section
            id="to-review-heading"
            title="Cần Cha xứ xem xét"
            className="hm-sheet-section priest-queue hm-paper"
            // Waiting on the Priest: the count breathes once and leaves at zero.
            extra={lists.length > 0 && <span className="hm-tab__count">{lists.length} danh sách</span>}
          >
            {pending.isPending && <SectionSkeleton rows={2} label="Đang tải danh sách bài hát chờ xem xét" />}
            {pending.isError && (
              <ErrorState
                headingLevel={3}
                title="Không thể tải danh sách bài hát chờ xem xét"
                error={pending.error} hasData={pending.data !== undefined} onRetry={() => pending.refetch()}
                retrying={pending.isFetching}
              />
            )}
            {pending.data !== undefined && lists.length === 0 && (
              <EmptyState
                headingLevel={3}
                icon={<AllDone />} title="Không có danh sách bài hát nào chờ xem xét"
                description="Bạn đã xử lý hết. Khi Ca trưởng gửi danh sách bài hát, danh sách sẽ xuất hiện tại đây."
              />
            )}
            {lists.length > 0 && (
              <ul className="priest-queue__list hm-stagger">
                {lists.map((list, index) => (
                  <li key={list.id} style={order(index)}>
                    <PendingSongList eventId={list.eventId} version={list.version} submittedAt={list.submittedAt} />
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </aside>
      </div>
    </div>
  )
}
