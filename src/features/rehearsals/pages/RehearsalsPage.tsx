import { Alert, App, Button, Card, Flex, Segmented, Select, Typography } from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { generatePath, Link, useNavigate, useSearchParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { formatProgramDate, useUpcomingPrograms } from '@/features/liturgical-programs'
import { vietnamToday } from '@/lib/api/dates'
import {
  CANCEL_LABEL,
  CREATE_REHEARSAL_LABEL,
  EmptyState,
  ErrorState,
  FilterBar,
  filterAllPlaceholder,
  Icon,
  NoFilterResults,
  PageHeader,
  PRACTICE_ROOM_ACTION,
  SectionSkeleton,
  SELECT_POPUP_PROPS,
} from '@/shared/ui'
import { colors, spacing } from '@/styles/tokens'
import { RehearsalFormDrawer } from '../components/RehearsalFormDrawer'
import { RehearsalTable } from '../components/RehearsalTable'
import { RehearsalDetail, RehearsalWeek } from '../components/RehearsalWeek'
import { useAllRehearsals, useDeleteRehearsal, useRehearsals, useSaveRehearsal } from '../hooks/useRehearsals'
import { rehearsalLabel } from '../rehearsalFormat'
import { rehearsalErrorMessage } from '../rehearsalErrors'
import { isRehearsalDay, isUpcoming, type Rehearsal, type RehearsalFilters, type RehearsalValues } from '../types'

const pageSize = 20

/**
 * Choir Director: rehearsal schedule (FE-26) on `/api/rehearsals`, newest first, filtered by program and start date
 * on the server, with create, edit and delete. `?programId=` preselects the program filter (link from the program
 * detail).
 */
export function RehearsalsPage() {
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialWeekAnchor = searchParams.get('week') && dayjs(searchParams.get('week')).isValid()
    ? dayjs(searchParams.get('week'))
    : dayjs(vietnamToday())
  const initialWeek = initialWeekAnchor.subtract((initialWeekAnchor.day() + 6) % 7, 'day')
  const [view, setView] = useState<'week' | 'list'>((searchParams.get('view') === 'list' ? 'list' : 'week'))
  const [weekStart, setWeekStart] = useState(initialWeek.format('YYYY-MM-DD'))
  const [direction, setDirection] = useState<'next' | 'prev'>()
  const [filters, setFilters] = useState<RehearsalFilters>({ eventId: searchParams.get('programId') ?? undefined })
  const [page, setPage] = useState(1)
  const weekFilters = { ...filters, fromDate: weekStart, toDate: dayjs(weekStart).add(6, 'day').format('YYYY-MM-DD') }
  const rehearsals = useRehearsals(filters, { pageNumber: page, pageSize })
  const weekRehearsals = useAllRehearsals(weekFilters)
  const [pickedId, setPickedId] = useState<string>()
  const programs = useUpcomingPrograms()
  const save = useSaveRehearsal()
  const remove = useDeleteRehearsal()
  // `null` = create; a rehearsal = edit; `undefined` = closed.
  const [editing, setEditing] = useState<Rehearsal | null>()

  const programMap = useMemo(() => new Map((programs.data ?? []).map((program) => [program.id, program])), [programs.data])
  const activeProgram = filters.eventId ? programMap.get(filters.eventId) : undefined
  // The session shown under the week: the one picked, else today's, else the next to come, else the first.
  // No choir filter: every session names its choir(s) on its card (owner 2026-11-24).
  const weekItems = (weekRehearsals.data?.items ?? [])
    .toSorted((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt))
  const picked =
    weekItems.find((rehearsal) => rehearsal.id === pickedId) ??
    weekItems.find((rehearsal) => isRehearsalDay(rehearsal)) ??
    weekItems.find((rehearsal) => isUpcoming(rehearsal)) ??
    weekItems[0]
  const todays = weekItems.find((rehearsal) => isRehearsalDay(rehearsal) && isUpcoming(rehearsal))
  const total = rehearsals.data?.totalCount ?? 0
  const filtered = Boolean(filters.eventId || filters.fromDate || filters.toDate)
  const changeFilters = (next: RehearsalFilters) => {
    setFilters(next)
    setPage(1)
    setSearchParams(
      (current) => {
        const nextParams = new URLSearchParams(current)
        if (next.eventId) nextParams.set('programId', next.eventId)
        else nextParams.delete('programId')
        return nextParams
      },
      { replace: true },
    )
  }
  const jumpToWeek = (isoDate: string) => {
    const anchor = dayjs(isoDate)
    const monday = anchor.subtract((anchor.day() + 6) % 7, 'day').format('YYYY-MM-DD')
    if (monday !== weekStart) setDirection(monday > weekStart ? 'next' : 'prev')
    setWeekStart(monday)
    setSearchParams(
      (current) => {
        const nextParams = new URLSearchParams(current)
        nextParams.set('week', monday)
        return nextParams
      },
      { replace: true },
    )
  }
  const changeWeek = (days: number) => {
    const next = dayjs(weekStart).add(days, 'day').format('YYYY-MM-DD')
    setDirection(days > 0 ? 'next' : 'prev')
    setWeekStart(next)
    setSearchParams(
      (current) => {
        const nextParams = new URLSearchParams(current)
        nextParams.set('week', next)
        return nextParams
      },
      { replace: true },
    )
  }
  const goToday = () => jumpToWeek(vietnamToday())
  const changeView = (next: 'week' | 'list') => {
    setView(next)
    setSearchParams(
      (current) => {
        const nextParams = new URLSearchParams(current)
        nextParams.set('view', next)
        return nextParams
      },
      { replace: true },
    )
  }
  const openPracticeRoom = (rehearsal: Rehearsal) =>
    navigate(generatePath(paths.director.rehearsalDetail, { rehearsalId: rehearsal.id }), { state: { rehearsal } })
  const takeAttendance = (rehearsal: Rehearsal) =>
    navigate(`${paths.director.attendance}?rehearsalId=${rehearsal.id}${rehearsal.eventId ? `&programId=${rehearsal.eventId}` : ''}`)

  const handleSave = (values: RehearsalValues) => {
    if (save.isPending) return
    save.mutate(
      { id: editing?.id, values, previous: editing ?? undefined },
      {
        onSuccess: (conflicts) => {
          message.success(editing ? 'Đã lưu thay đổi buổi tập.' : 'Đã tạo buổi tập.')
          // BE 69c9d47: members serving a program at that time are named; the session is saved anyway.
          if (conflicts?.length) {
            const names = [...new Set(conflicts.map((conflict) => conflict.fullName))]
            message.warning({
              duration: 8,
              content: `${names.length} ca viên đang được phân công ở lễ trùng giờ: ${names.slice(0, 5).join(', ')}${names.length > 5 ? '…' : ''}.`,
            })
          }
          setEditing(undefined)
        },
        onError: (error) => message.error(rehearsalErrorMessage(error, 'Không thể lưu buổi tập. Vui lòng thử lại.')),
      },
    )
  }

  const handleDelete = (rehearsal: Rehearsal) =>
    modal.confirm({
      title: `Xoá buổi tập ${rehearsalLabel(rehearsal)}?`,
      content: `Buổi tập sẽ bị xoá khỏi lịch tập. Buổi tập đã có điểm danh thì không xoá được.`,
      okText: 'Xoá buổi tập',
      okButtonProps: { danger: true },
      cancelText: CANCEL_LABEL,
      // Enter on a destructive dialog must not run it.
      focusable: { autoFocusButton: 'cancel' },
      onOk: () =>
        remove
          .mutateAsync(rehearsal.id)
          .then(() => message.success('Đã xoá buổi tập.'))
          .catch((error: Error) => message.error(rehearsalErrorMessage(error, 'Không thể xoá buổi tập. Vui lòng thử lại.'))),
    })

  const createButton = (
    <Button type="primary" icon={<Icon name="add" />} onClick={() => setEditing(null)}>
      {CREATE_REHEARSAL_LABEL}
    </Button>
  )
  const weekEnd = dayjs(weekStart).add(6, 'day')
  // ISO week: the week of its Thursday.
  const thursday = dayjs(weekStart).add(3, 'day')
  const weekNumber = Math.ceil((thursday.diff(thursday.startOf('year'), 'day') + 1) / 7)
  const weekLabel = `Tuần ${weekNumber} · ${dayjs(weekStart).format('DD/MM')} – ${weekEnd.format('DD/MM/YYYY')}`

  /** The list view's body: loading, error, empty, no match, or the table. */
  const listBody = () => {
    if (rehearsals.isPending) return <SectionSkeleton rows={6} label="Đang tải lịch tập" />
    if (rehearsals.isError) {
      return <ErrorState title="Không thể tải lịch tập" error={rehearsals.error} hasData={rehearsals.data !== undefined} onRetry={() => rehearsals.refetch()} retrying={rehearsals.isFetching} />
    }
    if (total === 0) {
      return (
        <div style={{ padding: `0 ${spacing.md}px ${spacing.md}px` }}>
          {filtered ? (
            <NoFilterResults onClearFilters={() => changeFilters({})} />
          ) : (
            <EmptyState title="Chưa có buổi tập nào" description="Lên lịch buổi tập để ca đoàn chuẩn bị cho các lễ sắp tới." action={createButton} />
          )}
        </div>
      )
    }
    return (
      <RehearsalTable
        rehearsals={rehearsals.data.items}
        programs={programMap}
        loading={rehearsals.isPlaceholderData}
        pagination={{ current: page, pageSize, total, hideOnSinglePage: true, showSizeChanger: false, onChange: setPage }}
        onOpenRoom={openPracticeRoom}
        onTakeAttendance={takeAttendance}
        onEdit={setEditing}
        onDelete={handleDelete}
      />
    )
  }

  return (
    <>
      <PageHeader
        title="Lịch tập"
        breadcrumb={[{ title: 'Ca trưởng' }, { title: 'Lịch tập' }]}
        description={view === 'week' ? weekLabel : 'Mọi buổi tập, mới nhất trước.'}
        extra={
          <>
            {view === 'week' && (
              <Flex gap={4} align="center">
                <Button icon={<Icon name="chevron-left" />} aria-label="Tuần trước" onClick={() => changeWeek(-7)} />
                <Button onClick={goToday}>Hôm nay</Button>
                <Button icon={<Icon name="chevron-right" />} aria-label="Tuần sau" onClick={() => changeWeek(7)} />
              </Flex>
            )}
            <Segmented
              aria-label="Kiểu xem"
              value={view}
              onChange={(value: string | number) => changeView(value === 'list' ? 'list' : 'week')}
              options={[{ label: 'Tuần', value: 'week' }, { label: 'Danh sách', value: 'list' }]}
            />
            {createButton}
          </>
        }
      />
      {activeProgram && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: spacing.md }}
          title={
            <Flex wrap align="center" justify="space-between" gap={spacing.sm}>
              <Typography.Text>
                Đang xem lịch tập cho chương trình:{' '}
                <strong>{activeProgram.eventName}</strong> · {formatProgramDate(activeProgram.date)}
              </Typography.Text>
              <Link to={generatePath(paths.director.programDetail, { programId: activeProgram.id })}>
                Xem chi tiết chương trình
              </Link>
            </Flex>
          }
        />
      )}
      {programs.isError && (
        <Alert
          type="warning"
          showIcon
          title="Không thể tải danh sách chương trình phụng vụ"
          description="Bộ lọc và ô chọn chương trình trong form cần danh sách này."
          action={
            <Button size="small" onClick={() => programs.refetch()} loading={programs.isFetching}>
              Thử lại
            </Button>
          }
          style={{ marginBottom: spacing.md }}
        />
      )}
      {/* Keyed by the view, so switching Tuần ↔ Danh sách rises in (.hm-swap answers the switch). */}
      <Flex key={view} vertical gap={spacing.lg} className="hm-swap">
          <FilterBar
            resultCount={view === 'list' ? rehearsals.data?.totalCount : weekRehearsals.data && weekItems.length}
            error={view === 'list' ? rehearsals.isError : weekRehearsals.isError}
            resultNoun="buổi tập"
            hasActiveFilters={filtered}
            onReset={() => changeFilters({})}
          >
              <Select
                {...SELECT_POPUP_PROPS}
                allowClear
                showSearch
                optionFilterProp="label"
                aria-label="Lọc theo chương trình phụng vụ"
                placeholder={filterAllPlaceholder('chương trình')}
                value={filters.eventId}
                onChange={(eventId?: string) => changeFilters({ ...filters, eventId })}
                options={(programs.data ?? []).map((program) => ({
                  value: program.id,
                  label: `${program.eventName} · ${formatProgramDate(program.date)}`,
                }))}
                style={{ width: 360, maxWidth: '100%' }}
              />
          </FilterBar>
          {view === 'week' && weekRehearsals.isPending && <SectionSkeleton rows={4} label="Đang tải lịch tuần" />}
          {view === 'week' && weekRehearsals.isError && <ErrorState title="Không thể tải lịch tập" error={weekRehearsals.error} onRetry={() => weekRehearsals.refetch()} retrying={weekRehearsals.isFetching} />}
          {view === 'week' ? (
            weekRehearsals.data !== undefined ? (
              weekRehearsals.data.items.length === 0 && filtered ? (
                rehearsals.data && rehearsals.data.totalCount > 0 ? (
                  <Alert
                    type="info"
                    showIcon
                    title={`Tuần này chưa có buổi tập cho bộ lọc đang chọn — có ${rehearsals.data.totalCount} buổi tập ở tuần khác.`}
                    description="Bạn có thể chuyển nhanh tới tuần có buổi tập gần nhất hoặc xem toàn bộ ở chế độ danh sách."
                    action={
                      <Flex wrap gap={spacing.xs}>
                        {rehearsals.data.items[0] && (
                          <Button
                            size="small"
                            type="primary"
                            onClick={() => {
                              const upcomingItem =
                                rehearsals.data.items.find((item) => isUpcoming(item)) ?? rehearsals.data.items[0]
                              jumpToWeek(dayjs(upcomingItem.startAt).format('YYYY-MM-DD'))
                            }}
                          >
                            Đến tuần có buổi tập
                          </Button>
                        )}
                        <Button size="small" onClick={() => changeView('list')}>
                          Xem dạng danh sách
                        </Button>
                      </Flex>
                    }
                  />
                ) : (
                  <div style={{ padding: spacing.md }}><NoFilterResults onClearFilters={() => changeFilters({})} /></div>
                )
              ) : (
                <>
                  {/* A week that has ended needs no schedule. */}
                  {weekRehearsals.data.items.length === 0 && !dayjs(weekStart).add(6, 'day').isBefore(dayjs(vietnamToday()), 'day') && (
                    <Flex align="center" justify="space-between" gap={spacing.md} wrap className="ctb-week-empty">
                      <div>
                        <Typography.Text style={{ display: 'block', fontWeight: 600 }}>Tuần này chưa có buổi tập nào.</Typography.Text>
                        <Typography.Text style={{ color: colors.textMuted }}>Lên lịch để ca đoàn kịp tập các bài của lễ sắp tới.</Typography.Text>
                      </div>
                      <Button icon={<Icon name="add" />} onClick={() => setEditing(null)}>
                        {CREATE_REHEARSAL_LABEL}
                      </Button>
                    </Flex>
                  )}
                  {todays && (
                    <div className="hm-today-band ctb-today">
                      <span className="ctb-today__chip">Hôm nay</span>
                      <b>
                        {dayjs(todays.startAt).format('HH:mm')} · {(todays.eventId && programMap.get(todays.eventId)?.eventName) || 'Buổi tập'}
                      </b>
                      <span className="ctb-today__meta">
                        {[todays.locationName, todays.songs.length > 0 ? `${todays.songs.length} bài` : 'Chưa chọn bài'].filter(Boolean).join(' · ')}
                      </span>
                      <Button type="primary" onClick={() => openPracticeRoom(todays)}>
                        {PRACTICE_ROOM_ACTION}
                      </Button>
                    </div>
                  )}
                  <Card styles={{ body: { padding: 0 } }} style={{ overflow: 'hidden' }}>
                  <RehearsalWeek
                    weekStart={weekStart}
                    direction={direction}
                    rehearsals={weekItems}
                    programs={programMap}
                    selectedId={picked?.id}
                    onSelect={(rehearsal) => setPickedId(rehearsal.id)}
                  />
                  </Card>
                  {picked && (
                    <Card styles={{ body: { padding: 0 } }}>
                    <RehearsalDetail
                      key={picked.id}
                      rehearsal={picked}
                      program={picked.eventId ? programMap.get(picked.eventId) : undefined}
                      onOpenRoom={openPracticeRoom}
                      onTakeAttendance={takeAttendance}
                      onEdit={setEditing}
                      onDelete={handleDelete}
                    />
                    </Card>
                  )}
                </>
              )
            ) : null
          ) : (
            <Card styles={{ body: { padding: 0 } }}>{listBody()}</Card>
          )}
      </Flex>
      <RehearsalFormDrawer
        open={editing !== undefined}
        programs={programs.data ?? []}
        rehearsal={editing ?? undefined}
        defaultProgramId={filters.eventId}
        saving={save.isPending}
        onSubmit={handleSave}
        onCancel={() => setEditing(undefined)}
      />
    </>
  )
}
