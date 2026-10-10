import { BarChartOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Card, Flex, Typography } from 'antd'
import dayjs from 'dayjs'
import { generatePath, useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { EventTable, formatProgramDate, useEvent, useEventNames, useEvents, vietnamToday } from '@/features/liturgical-programs'
import { usePendingSongLists } from '@/features/song-list-review'
import { parseUtc } from '@/lib/api/dates'
import { EmptyState, ErrorState, PageHeader, SectionSkeleton } from '@/shared/ui'
import { colors, spacing, typography } from '@/styles/tokens'

const upcomingLimit = 5

function Metric({ label, value }: { label: string; value?: number }) {
  return (
    <Card style={{ flex: '1 1 200px' }} styles={{ body: { padding: spacing.md } }}>
      <Typography.Text style={{ color: colors.textMuted }}>{label}</Typography.Text>
      <div style={{ marginTop: spacing.xs, fontFamily: typography.fontFamilyNumeric, fontSize: 28, fontWeight: 700 }}>
        {value ?? '–'}
      </div>
    </Card>
  )
}

/** A submitted list, named after its event (the pending lists carry only the event id). */
function PendingSongList({ eventId, version, submittedAt }: { eventId: string; version: number; submittedAt?: string }) {
  const navigate = useNavigate()
  const event = useEvent(eventId)
  const { eventName } = useEventNames()

  return (
    <Card styles={{ body: { padding: spacing.md } }}>
      <Flex wrap align="center" justify="space-between" gap={spacing.sm}>
        <div>
          <Typography.Text strong>
            {event.data ? `${eventName(event.data)} · ${formatProgramDate(event.data.date)}` : 'Sự kiện phụng vụ'}
          </Typography.Text>
          <Typography.Paragraph style={{ margin: 0, color: colors.textMuted }}>
            Ca trưởng đã gửi danh sách bài hát (phiên bản {version})
            {submittedAt && ` lúc ${dayjs(parseUtc(submittedAt)).format('HH:mm DD/MM/YYYY')}`}.
          </Typography.Paragraph>
        </div>
        <Button type="primary" onClick={() => navigate(generatePath(paths.priest.songListReview, { programId: eventId }))}>
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
        <Flex wrap gap={spacing.md}>
          <Metric label="Sự kiện sắp tới" value={upcoming.data?.totalCount} />
          <Metric label="Danh sách bài hát chờ xem xét" value={pending.data?.length} />
        </Flex>

        <section aria-labelledby="to-review-heading">
          <Typography.Title id="to-review-heading" level={2} style={{ marginBottom: spacing.md }}>
            Cần xem xét
          </Typography.Title>
          {pending.isPending && <SectionSkeleton rows={2} label="Đang tải danh sách bài hát chờ xem xét" />}
          {pending.isError && (
            <ErrorState
              title="Không thể tải danh sách bài hát chờ xem xét"
              onRetry={() => pending.refetch()}
              retrying={pending.isFetching}
            />
          )}
          {pending.isSuccess && pending.data.length === 0 && (
            <EmptyState
              title="Không có danh sách bài hát nào chờ xem xét"
              description="Khi Ca trưởng gửi danh sách bài hát, danh sách sẽ xuất hiện tại đây."
            />
          )}
          {pending.isSuccess && pending.data.length > 0 && (
            <Flex vertical gap={spacing.sm}>
              {pending.data.map((list) => (
                <PendingSongList key={list.id} eventId={list.eventId} version={list.version} submittedAt={list.submittedAt} />
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
            <ErrorState title="Không thể tải sự kiện sắp tới" onRetry={() => upcoming.refetch()} retrying={upcoming.isFetching} />
          )}
          {upcoming.isSuccess && upcoming.data.totalCount === 0 && (
            <EmptyState
              title="Chưa có sự kiện sắp tới"
              description="Tạo và công bố sự kiện phụng vụ để Ca trưởng bắt đầu chuẩn bị."
              action={createButton}
            />
          )}
          {upcoming.isSuccess && upcoming.data.totalCount > 0 && (
            <Card styles={{ body: { padding: 0 } }}>
              <EventTable
                events={upcoming.data.items}
                onOpen={(event) => navigate(generatePath(paths.priest.programDetail, { programId: event.id }))}
              />
            </Card>
          )}
        </section>

        <Card styles={{ body: { padding: spacing.lg } }}>
          <Flex wrap align="center" justify="space-between" gap={spacing.md}>
            <Flex align="center" gap={spacing.md}>
              <span aria-hidden style={{ fontSize: 22, color: colors.primary }}>
                <BarChartOutlined />
              </span>
              <div>
                <Typography.Text strong>Báo cáo</Typography.Text>
                <Typography.Paragraph style={{ margin: 0, color: colors.textMuted }}>
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
