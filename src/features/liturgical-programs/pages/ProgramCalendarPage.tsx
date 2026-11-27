import { Alert, Badge, Button, Calendar, Flex, Grid, Popover, Segmented, Select, Spin, Typography } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useId, useMemo, useState, type KeyboardEvent } from 'react'
import { generatePath, useNavigate, useSearchParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { vietnamToday } from '@/lib/api/dates'
import { ErrorState, Icon, PageHeader, SeasonChip, SectionSkeleton, SELECT_POPUP_PROPS, visuallyHidden } from '@/shared/ui'
import { colors, gold, spacing, typography } from '@/styles/tokens'
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
 * The Priest's own events are chips coloured by status, as `EventStatusTag` colours them: green once published, ochre
 * with a dashed outline while a draft, red and struck through once cancelled (global.css `.priest-event`). The
 * liturgical day from the API above them is bold ink.
 */
const eventChip = (status: LiturgicalEvent['status']) => `priest-event priest-event--${status}`

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
  const todayKey = vietnamToday()
  const today = useMemo(() => dayjs(todayKey), [todayKey])
  // The selected day is kept in `?date=`, so reload and the back button return to it; today needs no parameter.
  const [searchParams, setSearchParams] = useSearchParams()
  const dateParam = searchParams.get('date')
  const selected = useMemo(() => (dateParam && isoDate.test(dateParam) && dayjs(dateParam).isValid() ? dayjs(dateParam) : today), [dateParam, today])
  const setSelected = (date: Dayjs) => setSearchParams(date.isSame(today, 'day') ? {} : { date: date.format('YYYY-MM-DD') }, { replace: true })
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
    if (!step || !(event.target as HTMLElement).classList.contains('ant-picker-panel')) return
    event.preventDefault()
    setSelected(selected.add(step[0], step[1]))
  }
  const pickDate = setSelected
  const changeMonth = setSelected
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
          <Typography.Text ellipsis={{ tooltip: true }} style={{ fontSize: typography.metadata.fontSize, color: colors.textPrimary, fontWeight: 600 }}>
            {celebration}
          </Typography.Text>
        )}
        {items.slice(0, cellLimit).map((event) => (
          // Directly opens the event on click while keeping the status icon named for assistive technology.
          <button
            key={event.id}
            type="button"
            className={`priest-event-btn ${eventChip(event.status)}`}
            onClick={(click) => {
              click.stopPropagation()
              openEvent(event)
            }}
          >
            <Typography.Paragraph
              ellipsis={{ rows: 2, tooltip: true }}
              delete={event.status === 'cancelled'}
              style={{ margin: 0, fontSize: typography.metadata.fontSize, lineHeight: 1.35, color: 'inherit' }}
            >
              {/* Published is the usual state; the others carry a named icon, so the status does not rest on color alone
                  and the event's name keeps the cell's two lines. */}
              {event.status !== 'published' && (
                <span title={eventStatusLabels[event.status]} style={{ marginInlineEnd: 4 }}>
                  {event.status === 'draft' ? <Icon name="edit" label={eventStatusLabels.draft} /> : <Icon name="close-circle" label={eventStatusLabels.cancelled} />}
                </span>
              )}
              {event.time} {eventName(event)}
            </Typography.Paragraph>
          </button>
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
            <Popover
              trigger="click"
              placement="bottomRight"
              getPopupContainer={SELECT_POPUP_PROPS.getPopupContainer}
              content={
                <Flex vertical gap={spacing.sm} style={{ minWidth: 240 }}>
                  <SyncCalendarButton year={selected.year()} />
                  <GenerateEventsButton />
                </Flex>
              }
            >
              <Button icon={<Icon name="more" />}>Thao tác khác</Button>
            </Popover>
            <Button type="primary" icon={<Icon name="add" />} onClick={() => navigate(paths.priest.programCreate)}>
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
            <Flex wrap align="center" gap={spacing.sm} style={{ marginInlineStart: 'auto' }}>
              <Select
                {...SELECT_POPUP_PROPS}
                aria-label="Năm"
                value={selected.year()}
                onChange={(year: number) => changeMonth(selected.year(year))}
                options={Array.from({ length: 21 }, (_, index) => ({ value: selected.year() - 10 + index, label: selected.year() - 10 + index }))}
                style={{ minWidth: 84 }}
              />
              <Select
                {...SELECT_POPUP_PROPS}
                aria-label="Tháng"
                value={selected.month()}
                onChange={(monthIndex: number) => changeMonth(selected.month(monthIndex))}
                options={monthOptions}
                style={{ minWidth: 112 }}
              />
              <Flex gap={4} align="center">
                <Button icon={<Icon name="chevron-left" />} aria-label="Tháng trước" onClick={() => changeMonth(selected.subtract(1, 'month'))} />
                <Button onClick={() => changeMonth(today)}>Hôm nay</Button>
                <Button icon={<Icon name="chevron-right" />} aria-label="Tháng sau" onClick={() => changeMonth(selected.add(1, 'month'))} />
              </Flex>
            </Flex>
          </Flex>
          {!events.isPlaceholderData && events.data.totalCount === 0 && (
            <Alert
              type="info"
              showIcon
              title="Chưa có chương trình nào trong tháng này."
              description="Chọn một ngày trên lịch để xem ngày phụng vụ hoặc tạo chương trình."
            />
          )}
          <div className="hm-split priest-calendar__split">
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
                    mode="month"
                    onSelect={pickDate}
                    onPanelChange={changeMonth}
                    headerRender={() => null}
                    cellRender={(date, info) => (info.type === 'date' ? renderDate(date) : info.originNode)}
                  />
                </div>
              </Spin>
              {/* The key under the grid, each drawn the way the cells draw it. */}
              {screens.md && (
                <Flex component="ul" aria-label="Chú thích lịch" align="center" wrap gap={spacing.md} className="priest-calendar__key">
                  <li className={eventChip('published')}>{eventStatusLabels.published}</li>
                  <li className={eventChip('draft')}>
                    <Icon name="edit" /> {eventStatusLabels.draft}
                  </li>
                  <li className={eventChip('cancelled')}>
                    <Icon name="close-circle" /> <s>{eventStatusLabels.cancelled}</s>
                  </li>
                  <li>
                    <strong style={{ color: colors.textPrimary }}>Chữ đậm</strong>: ngày phụng vụ đồng bộ từ lịch trực tuyến
                  </li>
                </Flex>
              )}
          </section>
          {/* The picked day beside the month (owner 2026-11-17: no drawer): its liturgical day, its events, one action. */}
          <aside className="hm-preview" aria-label={dayTitle(selected)}>
            <span role="status" style={visuallyHidden}>
              {events.isPlaceholderData ? '' : `Ngày ${selected.format('DD/MM/YYYY')}: ${selectedEvents.length} sự kiện`}
            </span>
            <Typography.Text style={{ color: gold.ink, fontSize: typography.label.fontSize, fontWeight: 600 }}>{dayTitle(selected)}</Typography.Text>
            <LiturgicalDayInfo date={selectedKey} days={days} />
            <div>
              <p className="hm-rubric">Chương trình trong ngày</p>
              {events.isPlaceholderData && <Typography.Text style={{ color: colors.textMuted }}>Đang tải chương trình…</Typography.Text>}
              {!events.isPlaceholderData && selectedEvents.length === 0 && (
                <Flex vertical align="start" gap={spacing.xs}>
                  <Typography.Text style={{ color: colors.textMuted }}>
                    {statusFilter === 'all'
                      ? 'Chưa có chương trình nào.'
                      : `Không có chương trình ở trạng thái “${eventStatusLabels[statusFilter]}” trong ngày này.`}
                  </Typography.Text>
                  {statusFilter !== 'all' && (
                    <Button size="small" type="link" style={{ paddingInline: 0 }} onClick={() => setStatusFilter('all')}>
                      Hiện tất cả trạng thái
                    </Button>
                  )}
                </Flex>
              )}
              {!events.isPlaceholderData && selectedEvents.length > 0 && (
                <ul className="priest-day-events">
                  {selectedEvents.map((event) => (
                    <li key={event.id}>
                      <Flex vertical gap={2} style={{ minWidth: 0 }}>
                        <Typography.Text strong delete={event.status === 'cancelled'}>
                          {event.time} · {eventName(event)}
                        </Typography.Text>
                        <Flex align="center" gap={spacing.xs} wrap style={{ color: colors.textMuted, fontSize: typography.metadata.fontSize }}>
                          <EventStatusTag status={event.status} /> {event.locationName}
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
            {/* A day already gone takes no new program: BE refuses it (LITURGICAL_EVENT_ALREADY_PASSED). */}
            {selected.isBefore(today, 'day') ? (
              <Typography.Text style={{ color: colors.textMuted, fontSize: typography.metadata.fontSize }}>Ngày đã qua, không tạo thêm chương trình.</Typography.Text>
            ) : (
              <Button icon={<Icon name="add" />} onClick={createForDate}>
                Tạo chương trình cho ngày này
              </Button>
            )}
          </aside>
          </div>
        </Flex>
      )}
    </div>
  )
}
