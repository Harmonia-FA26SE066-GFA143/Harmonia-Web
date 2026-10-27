import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { Alert, App, Button, Card, DatePicker, Flex, Select, Typography } from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { generatePath, Link, useNavigate, useSearchParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { formatProgramDate, useUpcomingPrograms } from '@/features/liturgical-programs'
import { EmptyState, ErrorState, NoFilterResults, PageHeader, SectionSkeleton } from '@/shared/ui'
import { colors, sizes, spacing } from '@/styles/tokens'
import { RehearsalFormModal } from '../components/RehearsalFormModal'
import { RehearsalTable } from '../components/RehearsalTable'
import { useDeleteRehearsal, useRehearsals, useSaveRehearsal } from '../hooks/useRehearsals'
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
  const [searchParams] = useSearchParams()
  const [filters, setFilters] = useState<RehearsalFilters>({ eventId: searchParams.get('programId') ?? undefined })
  const [page, setPage] = useState(1)
  const rehearsals = useRehearsals(filters, { pageNumber: page, pageSize })
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
        description="Tạo và quản lý các buổi tập để chuẩn bị cho từng chương trình phụng vụ."
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
      {rehearsals.isPending && <SectionSkeleton rows={6} label="Đang tải lịch tập" />}
      {rehearsals.isError && (
        <ErrorState title="Không thể tải lịch tập" error={rehearsals.error} hasData={rehearsals.data !== undefined} onRetry={() => rehearsals.refetch()} retrying={rehearsals.isFetching} />
      )}
      {rehearsals.data !== undefined && total === 0 && !filtered && (
        <EmptyState
          title="Chưa có buổi tập nào"
          description="Tạo buổi tập để lên kế hoạch luyện tập và điểm danh."
          action={createButton}
        />
      )}
      {rehearsals.data !== undefined && (total > 0 || filtered) && (
        <Card styles={{ body: { padding: 0 } }}>
          <Flex wrap gap={spacing.sm} align="center" style={{ padding: spacing.md }}>
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
            <DatePicker.RangePicker
              aria-label="Lọc theo ngày tập"
              format="DD/MM/YYYY"
              placeholder={['Từ ngày', 'Đến ngày']}
              allowEmpty={[true, true]}
              value={[filters.fromDate ? dayjs(filters.fromDate) : null, filters.toDate ? dayjs(filters.toDate) : null]}
              onChange={(range) =>
                changeFilters({
                  ...filters,
                  fromDate: range?.[0]?.format('YYYY-MM-DD'),
                  toDate: range?.[1]?.format('YYYY-MM-DD'),
                })
              }
              style={{ flex: '1 1 260px', maxWidth: 320 }}
            />
            <Button icon={<ReloadOutlined />} onClick={() => changeFilters({})} disabled={!filtered}>
              Đặt lại bộ lọc
            </Button>
            <Typography.Text aria-live="polite" style={{ marginInlineStart: 'auto', color: colors.textMuted, lineHeight: `${sizes.controlHeight}px` }}>
              {total} buổi tập
            </Typography.Text>
          </Flex>
          {total === 0 ? (
            <div style={{ padding: `0 ${spacing.md}px ${spacing.md}px` }}>
              <NoFilterResults onClearFilters={() => changeFilters({})} />
            </div>
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
          )}
        </Card>
      )}
      <RehearsalFormModal
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
