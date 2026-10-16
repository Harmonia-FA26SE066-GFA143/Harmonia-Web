import { PlusOutlined } from '@ant-design/icons'
import { Alert, Badge, Button, Calendar, Card, Col, Flex, Grid, Row, Spin, Typography } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useMemo, useState } from 'react'
import { generatePath, useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { ErrorState, PageHeader, SectionSkeleton } from '@/shared/ui'
import { colors, spacing } from '@/styles/tokens'
import { EventStatusTag } from '../components/EventStatusTag'
import { ImportCalendarButton, LiturgicalDayInfo } from '../components/LiturgicalDayInfo'
import { useEventNames } from '../hooks/useEventNames'
import { useEvents } from '../hooks/useEvents'
import { useLiturgicalDays } from '../hooks/useLiturgicalDays'
import { eventStatusLabels, type LiturgicalEvent } from '../types'

const cellLimit = 2
// ponytail: one page of 100 events per month (the backend maximum); a busier month would need a second page.
const monthPage = { pageNumber: 1, pageSize: 100 }

/**
 * Priest: month calendar of the liturgical events (FE-15), loaded per month with the date filters of
 * `GET /api/liturgical-events`. The liturgical days of the month (`GET /api/liturgical-days`, filled by importing a
 * calendar feed) name each cell on wide screens and describe the selected day.
 */
export function ProgramCalendarPage() {
  const navigate = useNavigate()
  const screens = Grid.useBreakpoint()
  const { eventName } = useEventNames()
  const [selected, setSelected] = useState<Dayjs>(() => dayjs())
  const month = useMemo(
    () => ({ fromDate: selected.startOf('month').format('YYYY-MM-DD'), toDate: selected.endOf('month').format('YYYY-MM-DD') }),
    [selected],
  )
  const events = useEvents(month, monthPage)
  const days = useLiturgicalDays(month.fromDate, month.toDate)

  const byDate = useMemo(() => {
    const map = new Map<string, LiturgicalEvent[]>()
    for (const event of events.data?.items ?? []) map.set(event.date, [...(map.get(event.date) ?? []), event])
    return map
  }, [events.data])

  const selectedKey = selected.format('YYYY-MM-DD')
  const selectedEvents = byDate.get(selectedKey) ?? []
  const openEvent = (event: LiturgicalEvent) => navigate(generatePath(paths.priest.programDetail, { programId: event.id }))
  const createForDate = () => navigate(`${paths.priest.programCreate}?date=${selectedKey}`)

  const renderDate = (date: Dayjs) => {
    const key = date.format('YYYY-MM-DD')
    const items = byDate.get(key) ?? []
    if (!screens.md) return items.length > 0 ? <Badge color={colors.primary} aria-label={`${items.length} sự kiện`} /> : null
    const celebration = days.data?.get(key)?.celebrationName
    return (
      <Flex vertical gap={2}>
        {celebration && (
          <Typography.Text ellipsis={{ tooltip: true }} style={{ fontSize: 11, color: colors.textMuted }}>
            {celebration}
          </Typography.Text>
        )}
        {items.slice(0, cellLimit).map((event) => (
          <Typography.Text
            key={event.id}
            ellipsis={{ tooltip: true }}
            delete={event.status === 'cancelled'}
            style={{ fontSize: 12, color: event.status === 'published' ? colors.primary : colors.textMuted }}
          >
            {/* Published is the usual state; the others are named so the status does not rest on color alone. */}
            {event.status !== 'published' && `${eventStatusLabels[event.status]} · `}
            {event.time} {eventName(event)}
          </Typography.Text>
        ))}
        {items.length > cellLimit && (
          <Typography.Text style={{ fontSize: 12, color: colors.textMuted }}>+{items.length - cellLimit} khác</Typography.Text>
        )}
      </Flex>
    )
  }

  return (
    <>
      <PageHeader
        title="Lịch phụng vụ"
        breadcrumb={[{ title: 'Cha xứ' }, { title: 'Lịch phụng vụ' }]}
        description="Xem các sự kiện phụng vụ theo tháng, ngày phụng vụ của ngày đang chọn, và tạo sự kiện cho một ngày."
        extra={
          <Flex wrap gap={spacing.sm}>
            <ImportCalendarButton />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(paths.priest.programCreate)}>
              Tạo chương trình
            </Button>
          </Flex>
        }
      />
      {events.isPending && <SectionSkeleton rows={8} label="Đang tải lịch phụng vụ" />}
      {events.isError && (
        <ErrorState title="Không thể tải lịch phụng vụ" onRetry={() => events.refetch()} retrying={events.isFetching} />
      )}
      {events.isSuccess && (
        // From lg the day panel sits beside the calendar, so picking a day shows its events without scrolling.
        <Row gutter={[spacing.lg, spacing.lg]}>
          <Col xs={24} lg={16}>
            <Card styles={{ body: { padding: screens.md ? spacing.md : spacing.sm } }}>
              {/* The previous month stays on screen while the next one loads (keepPreviousData), so it is dimmed. */}
              <Spin spinning={events.isPlaceholderData} description="Đang tải tháng…">
                <Calendar
                  fullscreen={Boolean(screens.md)}
                  value={selected}
                  onSelect={setSelected}
                  cellRender={(date, info) => (info.type === 'date' ? renderDate(date) : info.originNode)}
                />
              </Spin>
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Flex vertical gap={spacing.lg}>
              {/* Kept out of the calendar column so switching between empty and busy months does not move the grid. */}
              {!events.isPlaceholderData && events.data.totalCount === 0 && (
                <Alert
                  type="info"
                  showIcon
                  title="Chưa có sự kiện nào trong tháng này."
                  description="Chọn một ngày trên lịch rồi bấm “Tạo chương trình cho ngày này”."
                />
              )}
              <Card title={`Ngày ${selected.format('DD/MM/YYYY')}`}>
                <div style={{ marginBottom: spacing.md }}>
                  <LiturgicalDayInfo date={selectedKey} days={days} />
                </div>
                <Button icon={<PlusOutlined />} onClick={createForDate} style={{ marginBottom: spacing.md }}>
                  Tạo chương trình cho ngày này
                </Button>
                {events.isPlaceholderData ? (
                  <Typography.Text style={{ color: colors.textMuted }}>Đang tải sự kiện…</Typography.Text>
                ) : selectedEvents.length === 0 ? (
                  <Typography.Text style={{ color: colors.textMuted }}>Chưa có sự kiện nào trong ngày này.</Typography.Text>
                ) : (
                  <Flex component="ul" vertical gap={spacing.sm} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {selectedEvents.map((event) => (
                      <Flex component="li" key={event.id} wrap align="center" justify="space-between" gap={spacing.sm}>
                        <Flex vertical>
                          <Typography.Text strong>
                            {event.time} · {eventName(event)}
                          </Typography.Text>
                          <Flex align="center" gap={spacing.xs} wrap style={{ color: colors.textMuted }}>
                            {event.locationName} <EventStatusTag status={event.status} />
                          </Flex>
                        </Flex>
                        <Button
                          onClick={() => openEvent(event)}
                          aria-label={`Xem chi tiết ${eventName(event)} lúc ${event.time}`}
                        >
                          Xem chi tiết
                        </Button>
                      </Flex>
                    ))}
                  </Flex>
                )}
              </Card>
            </Flex>
          </Col>
        </Row>
      )}
    </>
  )
}
