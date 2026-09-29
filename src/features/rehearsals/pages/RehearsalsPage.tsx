import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { App, Button, Card, Flex, Input, Segmented, Select } from 'antd'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { formatProgramDate, usePrograms } from '@/features/liturgical-programs'
import { EmptyState, ErrorState, NoFilterResults, PageHeader, SectionSkeleton } from '@/shared/ui'
import { matchesSearch } from '@/shared/utils/search'
import { spacing } from '@/styles/tokens'
import { RehearsalFormModal } from '../components/RehearsalFormModal'
import { RehearsalTable } from '../components/RehearsalTable'
import { useDeleteRehearsal, useRehearsals, useSaveRehearsal } from '../hooks/useRehearsals'
import { isUpcoming, type Rehearsal, type RehearsalValues } from '../types'

type Period = 'upcoming' | 'past'

/**
 * Choir Director: rehearsal schedule of the liturgical programs (FE-26), with create, edit and delete.
 * Upcoming and past are told apart by time only; there is no rehearsal status and no recurrence (decision
 * 2026-09-29). `?programId=` preselects the program filter (link from the program detail).
 */
export function RehearsalsPage() {
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const [searchParams] = useSearchParams()
  const rehearsals = useRehearsals()
  const programs = usePrograms()
  const save = useSaveRehearsal()
  const remove = useDeleteRehearsal()
  const [period, setPeriod] = useState<Period>('upcoming')
  const [programId, setProgramId] = useState<string | undefined>(searchParams.get('programId') ?? undefined)
  const [search, setSearch] = useState('')
  // `null` = create; a rehearsal = edit; `undefined` = closed.
  const [editing, setEditing] = useState<Rehearsal | null>()

  const programMap = useMemo(() => new Map((programs.data ?? []).map((program) => [program.id, program])), [programs.data])
  const all = useMemo(() => rehearsals.data ?? [], [rehearsals.data])
  const counts = useMemo(() => {
    const upcoming = all.filter((rehearsal) => isUpcoming(rehearsal)).length
    return { upcoming, past: all.length - upcoming }
  }, [all])
  const visible = useMemo(() => {
    const matching = all.filter(
      (rehearsal) =>
        isUpcoming(rehearsal) === (period === 'upcoming') &&
        (!programId || rehearsal.programId === programId) &&
        matchesSearch(search, rehearsal.name, rehearsal.location, programMap.get(rehearsal.programId)?.eventName),
    )
    // Past sessions: most recent first.
    return period === 'past' ? matching.reverse() : matching
  }, [all, period, programId, search, programMap])

  const resetFilters = () => {
    setProgramId(undefined)
    setSearch('')
  }

  const handleSave = (values: RehearsalValues) =>
    save.mutate(
      { id: editing?.id, values },
      {
        onSuccess: () => {
          message.success(editing ? 'Đã lưu thay đổi buổi tập.' : 'Đã tạo buổi tập.')
          setEditing(undefined)
        },
        onError: () => message.error('Không thể lưu buổi tập. Vui lòng thử lại.'),
      },
    )

  const handleDelete = (rehearsal: Rehearsal) =>
    modal.confirm({
      title: 'Xoá buổi tập?',
      content: `Buổi tập "${rehearsal.name}" sẽ bị xoá khỏi lịch tập.`,
      okText: 'Xoá buổi tập',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      onOk: () =>
        remove
          .mutateAsync(rehearsal.id)
          .then(() => message.success('Đã xoá buổi tập.'))
          .catch(() => message.error('Không thể xoá buổi tập. Vui lòng thử lại.')),
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
      {rehearsals.isPending && <SectionSkeleton rows={6} label="Đang tải lịch tập" />}
      {rehearsals.isError && (
        <ErrorState title="Không thể tải lịch tập" onRetry={() => rehearsals.refetch()} retrying={rehearsals.isFetching} />
      )}
      {rehearsals.isSuccess && all.length === 0 && (
        <EmptyState
          title="Chưa có buổi tập nào"
          description="Tạo buổi tập cho một chương trình phụng vụ để lên kế hoạch luyện tập và điểm danh."
          action={createButton}
        />
      )}
      {rehearsals.isSuccess && all.length > 0 && (
        <Card styles={{ body: { padding: 0 } }}>
          <Flex wrap gap={spacing.sm} align="center" style={{ padding: spacing.md }}>
            <Segmented<Period>
              value={period}
              onChange={setPeriod}
              options={[
                { value: 'upcoming', label: `Sắp tới (${counts.upcoming})` },
                { value: 'past', label: `Đã qua (${counts.past})` },
              ]}
            />
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              aria-label="Lọc theo chương trình phụng vụ"
              placeholder="Tất cả chương trình"
              value={programId}
              onChange={setProgramId}
              options={(programs.data ?? []).map((program) => ({
                value: program.id,
                label: `${program.eventName} · ${formatProgramDate(program.date)}`,
              }))}
              style={{ flex: '1 1 240px', maxWidth: 360, minWidth: 0 }}
            />
            <Input
              allowClear
              prefix={<SearchOutlined aria-hidden />}
              placeholder="Tìm theo tên buổi tập hoặc địa điểm"
              aria-label="Tìm buổi tập"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              style={{ flex: '1 1 240px', maxWidth: 360, minWidth: 0 }}
            />
          </Flex>
          {visible.length === 0 ? (
            <div style={{ padding: `0 ${spacing.md}px ${spacing.md}px` }}>
              {programId || search ? (
                <NoFilterResults onClearFilters={resetFilters} />
              ) : (
                <EmptyState
                  title={period === 'upcoming' ? 'Không có buổi tập sắp tới' : 'Chưa có buổi tập đã qua'}
                  description={period === 'upcoming' ? 'Tạo buổi tập mới để chuẩn bị cho chương trình sắp tới.' : undefined}
                />
              )}
            </div>
          ) : (
            <RehearsalTable
              rehearsals={visible}
              programs={programMap}
              onTakeAttendance={(rehearsal) => navigate(`${paths.director.attendance}?rehearsalId=${rehearsal.id}`)}
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
        defaultProgramId={programId}
        saving={save.isPending}
        onSubmit={handleSave}
        onCancel={() => setEditing(undefined)}
      />
    </>
  )
}
