import { EditOutlined, PlusOutlined, StopOutlined } from '@ant-design/icons'
import { Alert, Badge, Button, Calendar, Card, Col, Flex, Grid, Radio, Row, Select, Spin, Typography } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useId, useMemo, useState, type KeyboardEvent } from 'react'
import { generatePath, useNavigate, useSearchParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { CardTitle, ErrorState, PageHeader, SectionSkeleton, visuallyHidden } from '@/shared/ui'
import { cardSurface, colors, spacing } from '@/styles/tokens'
import { EventStatusTag } from '../components/EventStatusTag'
import { GenerateEventsButton } from '../components/GenerateEventsButton'
import { LiturgicalDayInfo, SyncCalendarButton } from '../components/LiturgicalDayInfo'
import { useEventNames } from '../hooks/useEventNames'
import { useEvents } from '../hooks/useEvents'
import { useLiturgicalDays } from '../hooks/useLiturgicalDays'
import { eventStatusLabels, type LiturgicalEvent } from '../types'

const cellLimit = 2
const monthOptions = Array.from({ length: 12 }, (_, index) => ({ value: index, label: `Tháng ${index + 1}` }))
const isoDate = /^\d{4}-\d{2}-\d{2}$/
/** "Thứ bảy, 17/10/2026": the weekday matters when planning a Mass. */
const dayTitle = (date: Dayjs) => {
  const weekday = date.format('dddd')
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${date.format('DD/MM/YYYY')}`
}

// The antd day grid takes focus but ignores the arrow keys, so they are handled here.
const keySteps: Record<string, [number, 'day' | 'month']> = {
  ArrowLeft: [-1, 'day'],
  ArrowRight: [1, 'day'],
  ArrowUp: [-7, 'day'],
  ArrowDown: [7, 'day'],
  PageUp: [-1, 'month'],
  PageDown: [1, 'month'],
}
// ponytail: one page of 100 events per month (the backend maximum); a busier month would need a second page.
const monthPage = { pageNumber: 1, pageSize: 100 }

/**
 * Priest: month calendar of the liturgical events (FE-15), loaded per month with the date filters of
 * `GET /api/liturgical-events`. The liturgical days of the month (`GET /api/liturgical-days`, filled by syncing a
 * year from the Liturgical Calendar API) name each cell on wide screens and describe the selected day.
 */
export function ProgramCalendarPage() {
  const navigate = useNavigate()
  const screens = Grid.useBreakpoint()
  const { eventName } = useEventNames()
  // The selected day is kept in `?date=`, so reload and the back button return to it; today needs no parameter.
  const [searchParams, setSearchParams] = useSearchParams()
  const dateParam = searchParams.get('date')
  const selected = useMemo(() => (dateParam && isoDate.test(dateParam) && dayjs(dateParam).isValid() ? dayjs(dateParam) : dayjs()), [dateParam])
  const setSelected = (date: Dayjs) => setSearchParams(date.isSame(dayjs(), 'day') ? {} : { date: date.format('YYYY-MM-DD') }, { replace: true })
  const [mode, setMode] = useState<'month' | 'year'>('month')
  const hintId = useId()
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
  const moveByKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = keySteps[event.key]
    // Only the day grid itself: the selects and the view switch keep their own keys.
    if (!step || mode !== 'month' || !(event.target as HTMLElement).classList.contains('ant-picker-panel')) return
    event.preventDefault()
    setSelected(selected.add(step[0], step[1]))
  }
  const createForDate = () => navigate(`${paths.priest.programCreate}?date=${selectedKey}`)

  const renderDate = (date: Dayjs) => {
    const key = date.format('YYYY-MM-DD')
    const items = byDate.get(key) ?? []
    if (!screens.md) return items.length > 0 ? <Badge color={colors.primary} aria-label={`${items.length} sự kiện`} /> : null
    const celebration = days.data?.get(key)?.celebrationName
    return (
      <Flex vertical gap={2}>
        {celebration && (
          <Typography.Text ellipsis={{ tooltip: true }} style={{ fontSize: 11, color: colors.textBody }}>
            {celebration}
          </Typography.Text>
        )}
        {items.slice(0, cellLimit).map((event) => (
          // Two lines, so the name is read in the cell; the tooltip still gives the whole of a longer one.
          <Typography.Paragraph
            key={event.id}
            ellipsis={{ rows: 2, tooltip: true }}
            delete={event.status === 'cancelled'}
            style={{ margin: 0, fontSize: 12, lineHeight: 1.35, color: event.status === 'published' ? colors.primary : colors.textBody }}
          >
            {/* Published is the usual state; the others carry a named icon, so the status does not rest on color alone
                and the event's name keeps the cell's two lines. */}
            {event.status !== 'published' && (
              <span title={eventStatusLabels[event.status]} style={{ marginInlineEnd: 4 }}>
                {event.status === 'draft' ? <EditOutlined aria-label={eventStatusLabels.draft} /> : <StopOutlined aria-label={eventStatusLabels.cancelled} />}
              </span>
            )}
            {event.time} {eventName(event)}
          </Typography.Paragraph>
        ))}
        {items.length > cellLimit && (
          <Typography.Text style={{ fontSize: 12, color: colors.textBody }}>+{items.length - cellLimit} khác</Typography.Text>
        )}
      </Flex>
    )
  }

  return (
    <div className="priest-calendar-page">
      <PageHeader
        title="Lịch phụng vụ"
        breadcrumb={[{ title: 'Cha xứ' }, { title: 'Lịch phụng vụ' }]}
        description="Xem các sự kiện phụng vụ theo tháng, ngày phụng vụ của ngày đang chọn, và tạo sự kiện cho một ngày."
        extra={
          <Flex wrap gap={spacing.sm}>
            <SyncCalendarButton year={selected.year()} />
            <GenerateEventsButton />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(paths.priest.programCreate)}>
              Tạo chương trình
            </Button>
          </Flex>
        }
      />
      {events.isPending && <SectionSkeleton rows={8} label="Đang tải lịch phụng vụ" />}
      {events.isError && (
        <ErrorState title="Không thể tải lịch phụng vụ" error={events.error} hasData={events.data !== undefined} onRetry={() => events.refetch()} retrying={events.isFetching} />
      )}
      {events.data !== undefined && (
        <Flex vertical gap={spacing.md}>
          <Card className="calendar-summary-card" style={cardSurface} styles={{ body: { padding: `${spacing.md}px ${spacing.lg}px` } }}>
            <Flex wrap align="center" justify="space-between" gap={spacing.md}>
              <Typography.Title level={3} style={{ margin: 0, fontSize: 19 }}>
                {selected.format('[Lịch tháng] M YYYY')}
              </Typography.Title>
              <Flex wrap gap={spacing.lg}>
                <div>
                  <Typography.Text style={{ display: 'block', color: colors.textMuted, fontSize: 12 }}>Sự kiện trong tháng</Typography.Text>
                  <Typography.Text strong style={{ fontSize: 20, fontVariantNumeric: 'tabular-nums' }}>{events.data.totalCount}</Typography.Text>
                </div>
                <div>
                  <Typography.Text style={{ display: 'block', color: colors.textMuted, fontSize: 12 }}>Ngày đang chọn</Typography.Text>
                  <Typography.Text strong style={{ fontSize: 20, fontVariantNumeric: 'tabular-nums' }}>{selected.format('DD/MM')}</Typography.Text>
                </div>
              </Flex>
            </Flex>
          </Card>
          {/* From xl the day panel sits beside the calendar, so picking a day shows its events without scrolling. */}
          <Row gutter={[spacing.md, spacing.md]}>
            <Col xs={24} xl={18}>
              <Card className="calendar-grid-card" style={cardSurface} styles={{ body: { padding: screens.md ? spacing.md : spacing.sm } }}>
              {/* The previous month stays on screen while the next one loads (keepPreviousData), so it is dimmed. */}
              <Spin spinning={events.isPlaceholderData} description="Đang tải tháng…">
                <div role="group" aria-label="Lịch sự kiện phụng vụ" aria-describedby={hintId} onKeyDown={moveByKey}>
                  <span id={hintId} style={visuallyHidden}>
                    Dùng phím mũi tên để đổi ngày, PageUp và PageDown để đổi tháng.
                  </span>
                  <Calendar
                    fullscreen={Boolean(screens.md)}
                    value={selected}
                    mode={mode}
                    onSelect={setSelected}
                    onPanelChange={(_, next) => setMode(next)}
                    headerRender={({ value, type, onChange, onTypeChange }) => (
                      <Flex justify="flex-end" wrap gap={spacing.sm} style={{ paddingBlockEnd: spacing.sm }}>
                        <Select
                          size="small"
                          aria-label="Năm"
                          value={value.year()}
                          onChange={(year: number) => onChange(value.year(year))}
                          options={Array.from({ length: 21 }, (_, index) => ({ value: value.year() - 10 + index, label: value.year() - 10 + index }))}
                          style={{ minWidth: 84 }}
                        />
                        {type === 'month' && (
                          <Select
                            size="small"
                            aria-label="Tháng"
                            value={value.month()}
                            onChange={(monthIndex: number) => onChange(value.month(monthIndex))}
                            options={monthOptions}
                            style={{ minWidth: 112 }}
                          />
                        )}
                        <Button size="small" onClick={() => setSelected(dayjs())}>
                          Hôm nay
                        </Button>
                        <Radio.Group
                          size="small"
                          optionType="button"
                          aria-label="Chế độ xem lịch"
                          value={type}
                          onChange={(event) => onTypeChange(event.target.value)}
                          options={[
                            { value: 'month', label: 'Tháng' },
                            { value: 'year', label: 'Năm' },
                          ]}
                        />
                      </Flex>
                    )}
                    cellRender={(date, info) => (info.type === 'date' ? renderDate(date) : info.originNode)}
                  />
                </div>
              </Spin>
              </Card>
            </Col>
            <Col xs={24} xl={6}>
              <Flex vertical gap={spacing.md}>
              {/* Kept out of the calendar column so switching between empty and busy months does not move the grid. */}
              {!events.isPlaceholderData && events.data.totalCount === 0 && (
                <Alert
                  type="info"
                  showIcon
                  title="Chưa có sự kiện nào trong tháng này."
                  description="Chọn một ngày trên lịch rồi bấm “Tạo chương trình” trong ô ngày bên cạnh."
                />
              )}
              <Card className="calendar-day-card" title={<CardTitle>{dayTitle(selected)}</CardTitle>}>
                <span role="status" style={visuallyHidden}>
                  {events.isPlaceholderData ? '' : `Ngày ${selected.format('DD/MM/YYYY')}: ${selectedEvents.length} sự kiện`}
                </span>
                <div style={{ marginBottom: spacing.md }}>
                  <LiturgicalDayInfo date={selectedKey} days={days} />
                </div>
                {/* The panel is narrow beside the calendar: a short label on one line; its name says which day. */}
                <Button block icon={<PlusOutlined />} onClick={createForDate} aria-label="Tạo chương trình cho ngày này" style={{ marginBottom: spacing.md }}>
                  Tạo chương trình
                </Button>
                {events.isPlaceholderData && (
                  <Typography.Text style={{ color: colors.textMuted }}>Đang tải sự kiện…</Typography.Text>
                )}
                {!events.isPlaceholderData && selectedEvents.length === 0 && (
                  <Typography.Text style={{ color: colors.textMuted }}>Chưa có sự kiện nào trong ngày này.</Typography.Text>
                )}
                {!events.isPlaceholderData && selectedEvents.length > 0 && (
                  <Flex component="ul" vertical gap={spacing.sm} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {selectedEvents.map((event, index) => (
                      <Flex component="li" className="calendar-event-row" key={event.id} wrap align="center" justify="space-between" gap={spacing.sm} style={{ animationDelay: `${Math.min(index, 6) * 30}ms` }}>
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
        </Flex>
      )}
    </div>
  )
}
