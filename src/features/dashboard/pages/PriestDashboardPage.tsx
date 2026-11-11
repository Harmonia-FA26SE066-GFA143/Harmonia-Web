import { PlusOutlined } from '@ant-design/icons'
import { Button, Card, Flex, Skeleton, Typography } from 'antd'
import dayjs from 'dayjs'
import type { ReactNode } from 'react'
import { generatePath, useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { EventStatusTag, formatProgramDate, useEvent, useEventNames, useEvents } from '@/features/liturgical-programs'
import { usePendingSongLists } from '@/features/song-list-review'
import { parseUtc, vietnamToday } from '@/lib/api/dates'
import { AllDone, EmptyState, EmptyWeek, ErrorState, PageHeader, SectionSkeleton } from '@/shared/ui'
import { cardSurface, colors, sections, spacing, typography } from '@/styles/tokens'
import { TodaySeason } from '../components/TodaySeason'

const upcomingLimit = 5

const muted = { color: colors.textMuted, fontSize: typography.metadata.fontSize }
const capitalize = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`

/** A submitted list, named after its event (the pending lists carry only the event id). */
function PendingSongList({ eventId, version, submittedAt }: Readonly<{ eventId: string; version: number; submittedAt?: string }>) {
  const navigate = useNavigate()
  const event = useEvent(eventId)
  const { eventName } = useEventNames()
  const label = event.data ? `${eventName(event.data)} · ${formatProgramDate(event.data.date)}` : 'Sự kiện phụng vụ'

  return (
    <Flex wrap align="center" justify="space-between" gap={spacing.sm}>
      <div>
        {event.isPending ? (
          // Keeps the title's place so the row does not jump when the event name arrives.
          <output aria-label="Đang tải tên sự kiện">
            <Skeleton.Input active size="small" />
          </output>
        ) : (
          <Typography.Text style={{ display: 'block', fontWeight: 600 }}>{label}</Typography.Text>
        )}
        <Typography.Text style={muted}>
          Ca trưởng gửi phiên bản {version}
          {submittedAt && ` lúc ${dayjs(parseUtc(submittedAt)).format('HH:mm DD/MM/YYYY')}`}
        </Typography.Text>
      </div>
      {/* Every row has this button, so the event is part of its name. */}
      <Button
        type="primary"
        aria-label={`Xem danh sách bài hát: ${label}`}
        onClick={() => navigate(generatePath(paths.priest.songListReview, { programId: eventId }))}
      >
        Xem danh sách bài hát
      </Button>
    </Flex>
  )
}

function Section({ id, title, extra, children }: Readonly<{ id: string; title: string; extra?: ReactNode; children: ReactNode }>) {
  return (
    <section aria-labelledby={id}>
      <Flex wrap align="center" justify="space-between" gap={spacing.sm} style={{ marginBottom: spacing.md }}>
        <Typography.Title id={id} level={2} style={{ margin: 0 }}>
          {title}
        </Typography.Title>
        {extra}
      </Flex>
      {children}
    </section>
  )
}

/**
 * Priest dashboard (Pattern 4, Dashboard / Overview; brief 2026-10-31, quiet and simple): the upcoming liturgical events
 * from `GET /api/liturgical-events` (FE-15) as a ruled list, beside today's season and the song lists waiting for the
 * Priest from `GET /api/song-lists/pending` (FE-17). Counts sit beside the section titles, no metric tiles. Each section
 * loads and fails on its own; reports (FE-22) are in the running head.
 */
export function PriestDashboardPage() {
  const navigate = useNavigate()
  const upcoming = useEvents({ fromDate: vietnamToday() }, { pageNumber: 1, pageSize: upcomingLimit })
  const pending = usePendingSongLists()
  const { name, eventName } = useEventNames()

  const createButton = (
    <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(paths.priest.programCreate)}>
      Tạo chương trình
    </Button>
  )

  return (
    <>
      <PageHeader
        title="Tổng quan"
        breadcrumb={[{ title: 'Cha xứ' }, { title: 'Tổng quan' }]}
        extra={createButton}
      />
      <div className="director-dashboard-grid">
        <Section
          id="upcoming-heading"
          title="Sự kiện sắp tới"
          extra={
            <Flex align="center" gap={spacing.md}>
              {upcoming.data && upcoming.data.totalCount > 0 && (
                <Typography.Text style={{ color: colors.textMuted }}>{upcoming.data.totalCount} sự kiện</Typography.Text>
              )}
              <Button onClick={() => navigate(paths.priest.programs)}>Xem tất cả</Button>
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
            // One ruled line per event, like the Director's list; the full table is on "Chương trình phụng vụ".
            <ol className="ordo">
              {upcoming.data.items.map((event) => {
                const title = eventName(event)
                const season = name('season', event.seasonId)
                const date = dayjs(event.date)
                return (
                  <li key={event.id} className="ordo-row">
                    <div className="ordo-line">
                      <span className="ordo-date">
                        <span className="ordo-meta">{capitalize(date.format('dddd'))}</span>
                        <span className="ordo-day">{date.format('DD')}</span>
                        <span className="ordo-meta">Tháng {date.format('M')}</span>
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <Typography.Text className="ordo-name">{title}</Typography.Text>
                        <span className="ordo-meta" style={{ display: 'block' }}>
                          {[event.time, event.locationName, season].filter(Boolean).join(' · ')}
                        </span>
                      </div>
                      <EventStatusTag status={event.status} />
                      <Button
                        onClick={() => navigate(generatePath(paths.priest.programDetail, { programId: event.id }))}
                        aria-label={`Xem chi tiết ${title} ngày ${formatProgramDate(event.date)}`}
                      >
                        Xem
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </Section>

        <Flex vertical gap={spacing.lg} style={{ minWidth: 0 }}>
          <TodaySeason />

        <Section
          id="to-review-heading"
          title="Cần xem xét"
          // Waiting on the Priest: the count in ochre ink while above zero (DESIGN.md, The Amber Is Earned Rule).
          extra={pending.data && pending.data.length > 0 && <Typography.Text style={{ color: sections.attention.ink, fontWeight: 600 }}>{pending.data.length} danh sách</Typography.Text>}
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
          {pending.data !== undefined && pending.data.length === 0 && (
            <EmptyState
              headingLevel={3}
              icon={<AllDone />} title="Không có danh sách bài hát nào chờ xem xét"
              description="Khi Ca trưởng gửi danh sách bài hát, danh sách sẽ xuất hiện tại đây."
            />
          )}
          {pending.data !== undefined && pending.data.length > 0 && (
            <Card style={cardSurface} styles={{ body: { padding: 0 } }}>
              <ul className="hm-stagger" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {pending.data.map((list, index) => (
                  <li key={list.id} style={{ padding: `${spacing.md}px ${spacing.lg}px`, borderTop: index > 0 ? `1px solid ${colors.border}` : undefined }}>
                    <PendingSongList eventId={list.eventId} version={list.version} submittedAt={list.submittedAt} />
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </Section>
        </Flex>
      </div>
    </>
  )
}
