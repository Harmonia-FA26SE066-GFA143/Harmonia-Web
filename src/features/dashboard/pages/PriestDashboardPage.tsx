import { BarChartOutlined, CalendarOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Card, Flex, Skeleton, Typography } from 'antd'
import dayjs from 'dayjs'
import { generatePath, useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { EventTable, formatProgramDate, useEvent, useEventNames, useEvents } from '@/features/liturgical-programs'
import { usePendingSongLists } from '@/features/song-list-review'
import { parseUtc, vietnamToday } from '@/lib/api/dates'
import { EmptyState, ErrorState, IconTile, MetricSummary, PageHeader, SectionSkeleton } from '@/shared/ui'
import { cardSurface, colors, spacing } from '@/styles/tokens'

const upcomingLimit = 5

const metrics = [
  { key: 'upcoming', label: 'Sự kiện sắp tới', icon: CalendarOutlined },
  { key: 'pending', label: 'Danh sách bài hát chờ xem xét' },
]

/** A submitted list, named after its event (the pending lists carry only the event id). */
function PendingSongList({ eventId, version, submittedAt }: Readonly<{ eventId: string; version: number; submittedAt?: string }>) {
  const navigate = useNavigate()
  const event = useEvent(eventId)
  const { eventName } = useEventNames()
  const label = event.data ? `${eventName(event.data)} · ${formatProgramDate(event.data.date)}` : 'Sự kiện phụng vụ'

  return (
    <Card
      style={cardSurface}
      styles={{ body: { padding: '18px 20px' } }}
    >
      <Flex wrap align="center" justify="space-between" gap={spacing.sm}>
        <div>
          {event.isPending ? (
            // Keeps the title's place so the card does not jump when the event name arrives.
            <output aria-label="Đang tải tên sự kiện">
              <Skeleton.Input active size="small" />
            </output>
          ) : (
            <Typography.Text strong style={{ fontSize: 15 }}>
              {label}
            </Typography.Text>
          )}
          <Typography.Paragraph style={{ margin: '4px 0 0', color: colors.textMuted, fontSize: 13.5 }}>
            Ca trưởng đã gửi danh sách bài hát (phiên bản {version})
            {submittedAt && ` lúc ${dayjs(parseUtc(submittedAt)).format('HH:mm DD/MM/YYYY')}`}.
          </Typography.Paragraph>
        </div>
        {/* Every card has this button, so the event is part of its name. */}
        <Button
          type="primary"
          aria-label={`Xem danh sách bài hát: ${label}`}
          onClick={() => navigate(generatePath(paths.priest.songListReview, { programId: eventId }))}
        >
          Xem danh sách bài hát
        </Button>
      </Flex>
    </Card>
  )
}

/**
 * Priest dashboard: upcoming liturgical events from `GET /api/liturgical-events` and the song lists waiting for review
 * from `GET /api/song-lists/pending` (FE-15, FE-17), with a link to reports (FE-22). Each section loads and fails on
 * its own. "Preparation status" from Stitch is not shown here; a published event shows it on its page.
 */
export function PriestDashboardPage() {
  const navigate = useNavigate()
  const upcoming = useEvents({ fromDate: vietnamToday() }, { pageNumber: 1, pageSize: upcomingLimit })
  const pending = usePendingSongLists()

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
        description="Theo dõi các sự kiện phụng vụ sắp tới và danh sách bài hát cần xem xét."
        extra={createButton}
      />
      <Flex vertical gap={spacing.xl}>
        <MetricSummary
          definitions={metrics}
          values={{ upcoming: upcoming.data?.totalCount, pending: pending.data?.length }}
        />

        <section aria-labelledby="to-review-heading">
          <Typography.Title id="to-review-heading" level={2} style={{ marginBottom: spacing.md }}>
            Cần xem xét
          </Typography.Title>
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
              title="Không có danh sách bài hát nào chờ xem xét"
              description="Khi Ca trưởng gửi danh sách bài hát, danh sách sẽ xuất hiện tại đây."
            />
          )}
          {pending.data !== undefined && pending.data.length > 0 && (
            <Flex component="ul" vertical gap={spacing.sm} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {pending.data.map((list) => (
                <li key={list.id}>
                  <PendingSongList eventId={list.eventId} version={list.version} submittedAt={list.submittedAt} />
                </li>
              ))}
            </Flex>
          )}
        </section>

        <section aria-labelledby="upcoming-heading">
          <Flex wrap align="center" justify="space-between" gap={spacing.sm} style={{ marginBottom: spacing.md }}>
            <Typography.Title id="upcoming-heading" level={2} style={{ margin: 0 }}>
              Sự kiện sắp tới
            </Typography.Title>
            <Button onClick={() => navigate(paths.priest.programs)}>Xem tất cả</Button>
          </Flex>
          {upcoming.isPending && <SectionSkeleton rows={upcomingLimit} label="Đang tải sự kiện sắp tới" />}
          {upcoming.isError && (
            <ErrorState headingLevel={3} title="Không thể tải sự kiện sắp tới" error={upcoming.error} hasData={upcoming.data !== undefined} onRetry={() => upcoming.refetch()} retrying={upcoming.isFetching} />
          )}
          {upcoming.data !== undefined && upcoming.data.totalCount === 0 && (
            <EmptyState
              headingLevel={3}
              title="Chưa có sự kiện sắp tới"
              description="Tạo và công bố sự kiện phụng vụ để Ca trưởng bắt đầu chuẩn bị."
              action={createButton}
            />
          )}
          {upcoming.data !== undefined && upcoming.data.totalCount > 0 && (
            <Card
              style={{ ...cardSurface, overflow: 'hidden' }}
              styles={{ body: { padding: 0 } }}
            >
              <EventTable
                events={upcoming.data.items}
                onOpen={(event) => navigate(generatePath(paths.priest.programDetail, { programId: event.id }))}
              />
            </Card>
          )}
        </section>

        <Card
          style={cardSurface}
          styles={{ body: { padding: spacing.lg } }}
        >
          <Flex wrap align="center" justify="space-between" gap={spacing.md}>
            <Flex align="center" gap={spacing.md}>
              <IconTile size={44}>
                <BarChartOutlined />
              </IconTile>
              <div>
                <Typography.Text strong style={{ fontSize: 15 }}>
                  Báo cáo
                </Typography.Text>
                <Typography.Paragraph style={{ margin: 0, color: colors.textMuted, fontSize: 13.5 }}>
                  Lịch sử phục vụ, sử dụng bài hát và tình trạng chuẩn bị của ca đoàn.
                </Typography.Paragraph>
              </div>
            </Flex>
            <Button onClick={() => navigate(paths.priest.reports)}>Xem báo cáo</Button>
          </Flex>
        </Card>
      </Flex>
    </>
  )
}
