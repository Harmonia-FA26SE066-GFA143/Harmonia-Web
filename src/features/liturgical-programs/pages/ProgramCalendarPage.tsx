import { EditOutlined, PlusOutlined, StopOutlined } from '@ant-design/icons'
import { Alert, Badge, Button, Calendar, Flex, Grid, Radio, Segmented, Select, Spin, Typography } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useId, useMemo, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { generatePath, useNavigate, useSearchParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { ErrorState, PageHeader, SeasonChip, SectionSkeleton, visuallyHidden } from '@/shared/ui'
import { colors, gold, priestEvent, radius, spacing, typography } from '@/styles/tokens'
import { EventStatusTag } from '../components/EventStatusTag'
import { GenerateEventsButton } from '../components/GenerateEventsButton'
import { LiturgicalDayInfo, SyncCalendarButton } from '../components/LiturgicalDayInfo'
import { useEventNames } from '../hooks/useEventNames'
import { useEvents } from '../hooks/useEvents'
import { useLiturgicalDays } from '../hooks/useLiturgicalDays'
import { eventStatusLabels, type EventStatus, type LiturgicalEvent } from '../types'

const statusFilters: (EventStatus | 'all')[] = ['all', 'published', 'draft', 'cancelled']

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
/**
 * The Priest's own events are chips: filled once published, a dashed outline while a draft, and no chip once
 * cancelled (struck through). The liturgical day above them stays plain grey text.
 */
const eventChip = (status: LiturgicalEvent['status']): CSSProperties => ({
  padding: '0 3px',
  borderRadius: radius.sm,
  border: status === 'cancelled' ? '1px solid transparent' : `1px ${status === 'draft' ? 'dashed' : 'solid'} ${priestEvent.border}`,
  background: status === 'published' ? priestEvent.background : 'transparent',
  color: status === 'published' ? priestEvent.text : colors.textBody,
})

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
  // Filters only the loaded month on screen; the backend query stays the whole month.
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'all'>('all')
  const hintId = useId()
  const month = useMemo(
    () => ({ fromDate: selected.startOf('month').format('YYYY-MM-DD'), toDate: selected.endOf('month').format('YYYY-MM-DD') }),
    [selected],
  )
  const events = useEvents(month, monthPage)
  const days = useLiturgicalDays(month.fromDate, month.toDate)

  const byDate = useMemo(() => {
    const map = new Map<string, LiturgicalEvent[]>()
    for (const event of events.data?.items ?? []) {
      if (statusFilter === 'all' || event.status === statusFilter) map.set(event.date, [...(map.get(event.date) ?? []), event])
    }
    return map
  }, [events.data, statusFilter])
  const countOf = (status: EventStatus | 'all') =>
    (events.data?.items ?? []).filter((event) => status === 'all' || event.status === status).length

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
    const day = days.data?.get(key)
    const celebration = day?.celebrationName
    // Interpreted: a season chip on the first day of the month and where the season changes, so the name is always
    // there without repeating it in thirty cells.
    const previousSeason = days.data?.get(date.subtract(1, 'day').format('YYYY-MM-DD'))?.seasonKey
    const showSeason = day?.seasonName && date.isSame(selected, 'month') && (date.date() === 1 || previousSeason !== day.seasonKey)
    return (
      <Flex vertical gap={2}>
        {showSeason && day?.seasonName && <SeasonChip size="small" seasonKey={day.seasonKey} seasonName={day.seasonName} />}
        {celebration && (
          <Typography.Text ellipsis={{ tooltip: true }} style={{ fontSize: typography.metadata.fontSize, color: colors.textBody }}>
            {celebration}
          </Typography.Text>
        )}
        {items.slice(0, cellLimit).map((event) => (
          // Two lines, so the name is read in the cell; the tooltip still gives the whole of a longer one.
          <Typography.Paragraph
            key={event.id}
            ellipsis={{ rows: 2, tooltip: true }}
            delete={event.status === 'cancelled'}
            style={{ ...eventChip(event.status), margin: 0, fontSize: typography.metadata.fontSize, lineHeight: 1.35 }}
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
          <Typography.Text style={{ fontSize: typography.metadata.fontSize, color: colors.textBody }}>+{items.length - cellLimit} khác</Typography.Text>
        )}
      </Flex>
    )
  }

  return (
    <div className="priest-calendar-page">
      <PageHeader
        title="Lịch phụng vụ"
        breadcrumb={[{ title: 'Cha xứ' }, { title: 'Lịch phụng vụ' }]}
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
          <Flex wrap align="center" gap={spacing.md}>
            <Typography.Title level={2} className="priest-calendar__month">
              {selected.format('[Tháng] M, YYYY')}
            </Typography.Title>
            <Segmented<EventStatus | 'all'>
              aria-label="Lọc theo trạng thái"
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusFilters.map((status) => ({
                value: status,
                label: `${status === 'all' ? 'Tất cả' : eventStatusLabels[status]} (${countOf(status)})`,
              }))}
            />
            {/* Year, month, today and the view on the same line as the month (artifact PriestCalendar). */}
            <Flex wrap gap={spacing.sm} style={{ marginInlineStart: 'auto' }}>
              <Select
                aria-label="Năm"
                value={selected.year()}
                onChange={(year: number) => setSelected(selected.year(year))}
                options={Array.from({ length: 21 }, (_, index) => ({ value: selected.year() - 10 + index, label: selected.year() - 10 + index }))}
                style={{ minWidth: 84 }}
              />
              {mode === 'month' && (
                <Select
                  aria-label="Tháng"
                  value={selected.month()}
                  onChange={(monthIndex: number) => setSelected(selected.month(monthIndex))}
                  options={monthOptions}
                  style={{ minWidth: 112 }}
                />
              )}
              <Button onClick={() => setSelected(dayjs())}>Hôm nay</Button>
              <Radio.Group
                optionType="button"
                aria-label="Chế độ xem lịch"
                value={mode}
                onChange={(event) => setMode(event.target.value)}
                options={[
                  { value: 'month', label: 'Tháng' },
                  { value: 'year', label: 'Năm' },
                ]}
              />
            </Flex>
          </Flex>
          {/* The day panel sits beside the calendar, so picking a day shows its events without scrolling. */}
          <div className="hm-split">
            <section className="hm-sheet-section priest-calendar__grid" aria-label="Lịch tháng">
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
                    headerRender={() => null}
                    cellRender={(date, info) => (info.type === 'date' ? renderDate(date) : info.originNode)}
                  />
                </div>
              </Spin>
              {/* The key under the grid, each drawn the way the cells draw it. */}
              {mode === 'month' && screens.md && (
                <Flex component="ul" aria-label="Chú thích lịch" align="center" wrap gap={spacing.md} className="priest-calendar__key">
                  <li style={eventChip('published')}>Sự kiện do cha xứ tạo</li>
                  <li style={eventChip('draft')}>
                    <EditOutlined aria-hidden /> {eventStatusLabels.draft}
                  </li>
                  <li style={eventChip('cancelled')}>
                    <StopOutlined aria-hidden /> <s>{eventStatusLabels.cancelled}</s>
                  </li>
                  <li>Ngày phụng vụ đồng bộ từ lịch trực tuyến</li>
                </Flex>
              )}
            </section>
            {/* The picked day, read on the reading surface (artifact PriestCalendar). */}
            <aside className="hm-preview hm-paper" aria-label={dayTitle(selected)}>
              <span role="status" style={visuallyHidden}>
                {events.isPlaceholderData ? '' : `Ngày ${selected.format('DD/MM/YYYY')}: ${selectedEvents.length} sự kiện`}
              </span>
              <Typography.Text style={{ color: gold.ink, fontSize: typography.label.fontSize, fontWeight: 600 }}>{dayTitle(selected)}</Typography.Text>
              <LiturgicalDayInfo date={selectedKey} days={days} />
              <Button icon={<PlusOutlined />} onClick={createForDate}>
                Tạo chương trình cho ngày này
              </Button>
              {!events.isPlaceholderData && events.data.totalCount === 0 && (
                <Alert
                  type="info"
                  showIcon
                  title="Chưa có sự kiện nào trong tháng này."
                  description="Chọn một ngày trên lịch rồi bấm “Tạo chương trình cho ngày này”."
                />
              )}
              <div>
                <p className="hm-rubric">Sự kiện trong ngày</p>
                {events.isPlaceholderData && <Typography.Text style={{ color: colors.textMuted }}>Đang tải sự kiện…</Typography.Text>}
                {!events.isPlaceholderData && selectedEvents.length === 0 && (
                  <Typography.Text style={{ color: colors.textMuted }}>Chưa có sự kiện nào trong ngày này.</Typography.Text>
                )}
                {!events.isPlaceholderData && selectedEvents.length > 0 && (
                  <ul className="priest-day-events">
                    {selectedEvents.map((event) => (
                      <li key={event.id}>
                        <Flex vertical gap={2} style={{ minWidth: 0 }}>
                          <Typography.Text strong>
                            {event.time} · {eventName(event)}
                          </Typography.Text>
                          <Flex align="center" gap={spacing.xs} wrap style={{ color: colors.textMuted, fontSize: typography.metadata.fontSize }}>
                            {event.locationName} <EventStatusTag status={event.status} />
                          </Flex>
                        </Flex>
                        <Button onClick={() => openEvent(event)} aria-label={`Xem chi tiết ${eventName(event)} lúc ${event.time}`}>
                          Xem
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </aside>
          </div>
        </Flex>
      )}
    </div>
  )
}
