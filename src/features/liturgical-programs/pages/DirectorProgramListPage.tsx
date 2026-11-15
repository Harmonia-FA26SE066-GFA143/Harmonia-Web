import { Card, Flex, Segmented } from 'antd'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import { generatePath, useNavigate, useSearchParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { NoChoirNotice } from '@/features/choirs'
import { EmptyState, EmptyWeek, ErrorState, NoFilterResults, PageHeader, SectionSkeleton } from '@/shared/ui'
import { spacing } from '@/styles/tokens'
import { EventFilterBar } from '../components/EventFilterBar'
import { ProgramPreview } from '../components/ProgramPreview'
import { ProgramTable } from '../components/ProgramTable'
import { usePrograms } from '../hooks/usePrograms'
import { hasActiveEventFilters, readEventListState, writeEventListState } from '../programFilters'
import type { EventFilters } from '../types'

const pageSize = 20

type When = 'all' | 'upcoming' | 'past'

/** "Sắp tới / Đã qua" (artifact ProgramsPage) as the date range GET /api/liturgical-events filters on. */
const whenOf = (filters: EventFilters, today: string, yesterday: string): When => {
  if (filters.fromDate === today && !filters.toDate) return 'upcoming'
  return !filters.fromDate && filters.toDate === yesterday ? 'past' : 'all'
}

/**
 * Choir Director: liturgical programs to prepare song lists for (FE-30), on `GET /api/liturgical-events`, which
 * leaves out the Priest's drafts and filters on the server. The Director does not create programs.
 */
export function DirectorProgramListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { filters, page } = useMemo(() => readEventListState(searchParams), [searchParams])
  const programs = usePrograms(filters, { pageNumber: page, pageSize })

  const today = dayjs().format('YYYY-MM-DD')
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
  const total = programs.data?.totalCount ?? 0
  const filtered = hasActiveEventFilters(filters)
  // Filters and page are in the URL, so reload and the back button keep them.
  const changeFilters = (next: EventFilters) => setSearchParams(writeEventListState(next, 1), { replace: true })
  const setPage = (next: number) => setSearchParams(writeEventListState(filters, next), { replace: true })
  const resetFilters = () => changeFilters({})
  const items = programs.data?.items ?? []
  // The previewed program is kept in the URL beside the filters; the first row until one is picked.
  const picked = items.find((program) => program.id === searchParams.get('program')) ?? items.find((program) => program.status !== 'cancelled')
  const pick = (id: string) =>
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.set('program', id)
        return next
      },
      { replace: true },
    )
  const changeWhen = (when: When) =>
    changeFilters({
      ...filters,
      fromDate: when === 'upcoming' ? today : undefined,
      toDate: when === 'past' ? yesterday : undefined,
    })
  const openProgram = (id: string) => navigate(generatePath(paths.director.programDetail, { programId: id }))
  const propose = (id: string) => navigate(generatePath(paths.director.songListProposal, { programId: id }))

  return (
    <>
      <PageHeader
        title="Chương trình phụng vụ"
        breadcrumb={[{ title: 'Ca trưởng' }, { title: 'Chương trình phụng vụ' }]}
        description="Các Thánh lễ Cha xứ đã lên lịch; Ca trưởng đề xuất danh sách bài hát cho từng lễ."
      />
      <NoChoirNotice />
      {programs.isPending && <SectionSkeleton rows={6} label="Đang tải danh sách chương trình" />}
      {programs.isError && (
        <ErrorState
          title="Không thể tải danh sách chương trình"
          error={programs.error} hasData={programs.data !== undefined} onRetry={() => programs.refetch()}
          retrying={programs.isFetching}
        />
      )}
      {programs.data !== undefined && total === 0 && !filtered && (
        <EmptyState
          icon={<EmptyWeek />} title="Chưa có chương trình phụng vụ nào"
          description="Chương trình Cha xứ công bố sẽ xuất hiện tại đây."
        />
      )}
      {programs.data !== undefined && (total > 0 || filtered) && (
        <>
        <EventFilterBar
          value={filters}
          onChange={changeFilters}
          onReset={resetFilters}
          resultCount={total}
          unit="chương trình"
          statuses={['published', 'cancelled']}
          style={{ padding: 0, marginBottom: spacing.lg }}
          leading={
            <Flex vertical gap={4}>
              <span style={{ fontSize: 12, color: 'var(--hm-text-muted)' }}>Thời gian</span>
              <Segmented<When>
                aria-label="Khoảng thời gian"
                value={whenOf(filters, today, yesterday)}
                onChange={changeWhen}
                options={[
                  { value: 'all', label: 'Tất cả' },
                  { value: 'upcoming', label: 'Sắp tới' },
                  { value: 'past', label: 'Đã qua' },
                ]}
              />
            </Flex>
          }
        />
        <div className="hm-split">
          <Card styles={{ body: { padding: 0 } }}>
            {total === 0 ? (
              <div style={{ padding: spacing.lg }}>
                <NoFilterResults onClearFilters={resetFilters} />
              </div>
            ) : (
              <ProgramTable
                programs={items}
                today={today}
                selectedId={picked?.id}
                onSelect={(program) => pick(program.id)}
                loading={programs.isPlaceholderData}
                pagination={{ current: page, pageSize, total, hideOnSinglePage: true, showSizeChanger: false, onChange: setPage }}
                onOpen={(program) => openProgram(program.id)}
                onPropose={(program) => propose(program.id)}
              />
            )}
          </Card>
          {picked && <ProgramPreview program={picked} today={today} onOpen={() => openProgram(picked.id)} onPropose={() => propose(picked.id)} />}
        </div>
        </>
      )}
    </>
  )
}
