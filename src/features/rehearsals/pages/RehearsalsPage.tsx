import { LeftOutlined, PlusOutlined, RightOutlined } from '@ant-design/icons'
import { Alert, App, Button, Card, Flex, Segmented, Select, Typography } from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { generatePath, Link, useNavigate, useSearchParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { formatProgramDate, useUpcomingPrograms } from '@/features/liturgical-programs'
import { vietnamToday } from '@/lib/api/dates'
import { EmptyState, ErrorState, NoFilterResults, PageHeader, SectionSkeleton } from '@/shared/ui'
import { sizes, spacing } from '@/styles/tokens'
import { RehearsalDetailDrawer } from '../components/RehearsalDetailDrawer'
import { RehearsalFormDrawer } from '../components/RehearsalFormDrawer'
import { RehearsalTable } from '../components/RehearsalTable'
import { RehearsalWeek } from '../components/RehearsalWeek'
import { useAllRehearsals, useDeleteRehearsal, useRehearsals, useSaveRehearsal } from '../hooks/useRehearsals'
import { rehearsalLabel } from '../rehearsalFormat'
import { rehearsalErrorMessage } from '../rehearsalErrors'
import type { Rehearsal, RehearsalFilters, RehearsalValues } from '../types'

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
  const [filters, setFilters] = useState<RehearsalFilters>({ eventId: searchParams.get('programId') ?? undefined })
  const [page, setPage] = useState(1)
  const weekFilters = { ...filters, fromDate: weekStart, toDate: dayjs(weekStart).add(6, 'day').format('YYYY-MM-DD') }
  const rehearsals = useRehearsals(filters, { pageNumber: page, pageSize })
  const weekRehearsals = useAllRehearsals(weekFilters)
  const [detail, setDetail] = useState<Rehearsal>()
  const programs = useUpcomingPrograms()
  const save = useSaveRehearsal()
  const remove = useDeleteRehearsal()
  // `null` = create; a rehearsal = edit; `undefined` = closed.
  const [editing, setEditing] = useState<Rehearsal | null>()

  const programMap = useMemo(() => new Map((programs.data ?? []).map((program) => [program.id, program])), [programs.data])
  const activeProgram = filters.eventId ? programMap.get(filters.eventId) : undefined
  const total = rehearsals.data?.totalCount ?? 0
  const filtered = Boolean(filters.eventId || filters.fromDate || filters.toDate)
  const changeFilters = (next: RehearsalFilters) => {
    setFilters(next)
    setPage(1)
  }
  const changeWeek = (days: number) => {
    const next = dayjs(weekStart).add(days, 'day').format('YYYY-MM-DD')
    setWeekStart(next)
    setSearchParams((current) => {
      const nextParams = new URLSearchParams(current)
      nextParams.set('week', next)
      return nextParams
    })
  }
  const goToday = () => {
    const todayAnchor = dayjs(vietnamToday())
    const today = todayAnchor.subtract((todayAnchor.day() + 6) % 7, 'day').format('YYYY-MM-DD')
    setWeekStart(today)
    setSearchParams((current) => {
      const nextParams = new URLSearchParams(current)
      nextParams.set('week', today)
      return nextParams
    })
  }
  const changeView = (next: 'week' | 'list') => {
    setView(next)
    setSearchParams((current) => {
      const nextParams = new URLSearchParams(current)
      nextParams.set('view', next)
      return nextParams
    })
  }
  const openPracticeRoom = (rehearsal: Rehearsal) =>
    navigate(generatePath(paths.director.rehearsalDetail, { rehearsalId: rehearsal.id }), { state: { rehearsal } })

  const handleSave = (values: RehearsalValues) => {
    if (save.isPending) return
    save.mutate(
      { id: editing?.id, values },
      {
        onSuccess: () => {
          message.success(editing ? 'Đã lưu thay đổi buổi tập.' : 'Đã tạo buổi tập.')
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
      cancelText: 'Hủy',
      // Enter on a destructive dialog must not run it.
      autoFocusButton: 'cancel',
      onOk: () =>
        remove
          .mutateAsync(rehearsal.id)
          .then(() => message.success('Đã xoá buổi tập.'))
          .catch((error: Error) => message.error(rehearsalErrorMessage(error, 'Không thể xoá buổi tập. Vui lòng thử lại.'))),
    })

  const createButton = (
    <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing(null)}>
      Tạo buổi tập
    </Button>
  )

  return (
    <>
      <PageHeader
        title="Lịch tập"
        breadcrumb={[{ title: 'Ca trưởng' }, { title: 'Lịch tập' }]}
        extra={createButton}
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
      <Card styles={{ body: { padding: 0 } }}>
          <Flex vertical gap={spacing.sm} style={{ padding: spacing.md }}>
            <Flex wrap gap={spacing.sm} align="center">
              <Flex gap={4} align="center">
                <Button icon={<LeftOutlined />} aria-label="Tuần trước" onClick={() => changeWeek(-7)} />
                <Button onClick={goToday}>Hôm nay</Button>
                <Button icon={<RightOutlined />} aria-label="Tuần sau" onClick={() => changeWeek(7)} />
              </Flex>
              <Typography.Text strong style={{ fontVariantNumeric: 'tabular-nums', lineHeight: `${sizes.controlHeight}px` }}>
                {dayjs(weekStart).format('DD/MM')} – {dayjs(weekStart).add(6, 'day').format('DD/MM/YYYY')}
              </Typography.Text>
              <Segmented
                value={view}
                onChange={(value: string | number) => changeView(value === 'list' ? 'list' : 'week')}
                options={[{ label: 'Tuần', value: 'week' }, { label: 'Danh sách', value: 'list' }]}
              />
            </Flex>
            <Flex wrap gap={spacing.sm} align="center">
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                aria-label="Lọc theo chương trình phụng vụ"
                placeholder="Tất cả chương trình"
                value={filters.eventId}
                onChange={(eventId?: string) => changeFilters({ ...filters, eventId })}
                options={(programs.data ?? []).map((program) => ({
                  value: program.id,
                  label: `${program.eventName} · ${formatProgramDate(program.date)}`,
                }))}
                style={{ flex: '1 1 240px', maxWidth: 360, minWidth: 0 }}
              />
              {filtered && view === 'week' && <Button onClick={() => changeFilters({})}>Đặt lại bộ lọc</Button>}
            </Flex>
          </Flex>
          {view === 'week' && weekRehearsals.isPending && <SectionSkeleton rows={4} label="Đang tải lịch tuần" />}
          {view === 'week' && weekRehearsals.isError && <ErrorState title="Không thể tải lịch tập" error={weekRehearsals.error} onRetry={() => weekRehearsals.refetch()} retrying={weekRehearsals.isFetching} />}
          {view === 'week' ? (
            weekRehearsals.data !== undefined ? (
              weekRehearsals.data.items.length === 0 && filtered ? (
                <div style={{ padding: spacing.md }}><NoFilterResults onClearFilters={() => changeFilters({})} /></div>
              ) : (
                <>
                  {weekRehearsals.data.items.length === 0 && (
                    <Typography.Text type="secondary" style={{ display: 'block', padding: `0 ${spacing.md}px ${spacing.md}px` }}>
                      Tuần này chưa có buổi tập nào.
                    </Typography.Text>
                  )}
                  <RehearsalWeek weekStart={weekStart} rehearsals={weekRehearsals.data.items} programs={programMap} onSelect={openPracticeRoom} />
                </>
              )
            ) : null
          ) : (
            rehearsals.isPending ? <SectionSkeleton rows={6} label="Đang tải lịch tập" /> : rehearsals.isError ? (
              <ErrorState title="Không thể tải lịch tập" error={rehearsals.error} hasData={rehearsals.data !== undefined} onRetry={() => rehearsals.refetch()} retrying={rehearsals.isFetching} />
            ) : total === 0 && !filtered ? (
              <div style={{ padding: `0 ${spacing.md}px ${spacing.md}px` }}><EmptyState title="Chưa có buổi tập nào" description="Tạo buổi tập để lên kế hoạch luyện tập." action={createButton} /></div>
            ) : total === 0 ? (
              <div style={{ padding: `0 ${spacing.md}px ${spacing.md}px` }}><NoFilterResults onClearFilters={() => changeFilters({})} /></div>
            ) : (
              <RehearsalTable
                rehearsals={rehearsals.data.items}
                programs={programMap}
                loading={rehearsals.isPlaceholderData}
                pagination={{ current: page, pageSize, total, hideOnSinglePage: true, showSizeChanger: false, onChange: setPage }}
                onTakeAttendance={(rehearsal) =>
                  navigate(`${paths.director.attendance}?rehearsalId=${rehearsal.id}${rehearsal.eventId ? `&programId=${rehearsal.eventId}` : ''}`)
                }
                onEdit={setEditing}
                onDelete={handleDelete}
              />
            )
          )}
      </Card>
      <RehearsalDetailDrawer
        rehearsal={detail}
        program={detail?.eventId ? programMap.get(detail.eventId) : undefined}
        onClose={() => setDetail(undefined)}
        onAttendance={(rehearsal) => {
          setDetail(undefined)
          navigate(`${paths.director.attendance}?rehearsalId=${rehearsal.id}${rehearsal.eventId ? `&programId=${rehearsal.eventId}` : ''}`)
        }}
        onEdit={(rehearsal) => {
          setDetail(undefined)
          setEditing(rehearsal)
        }}
        onDelete={(rehearsal) => {
          setDetail(undefined)
          handleDelete(rehearsal)
        }}
      />
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
