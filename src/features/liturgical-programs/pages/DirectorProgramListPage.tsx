import { Card } from 'antd'
import { useMemo, useState } from 'react'
import { generatePath, useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { EmptyState, ErrorState, NoFilterResults, PageHeader, SectionSkeleton } from '@/shared/ui'
import { spacing } from '@/styles/tokens'
import { ProgramFilterBar } from '../components/ProgramFilterBar'
import { ProgramTable } from '../components/ProgramTable'
import { usePrograms } from '../hooks/usePrograms'
import { emptyProgramFilters, filterPrograms } from '../programFilters'
import type { ProgramFilters } from '../types'

/**
 * Choir Director: liturgical programs to prepare song lists for (FE-30). Shows all programs: which programs
 * are assigned to which Director or choir is not defined (TBD). The Director does not create programs.
 */
export function DirectorProgramListPage() {
  const navigate = useNavigate()
  const programs = usePrograms()
  const [filters, setFilters] = useState<ProgramFilters>(emptyProgramFilters)
  const all = useMemo(() => programs.data ?? [], [programs.data])
  const visible = useMemo(() => filterPrograms(all, filters), [all, filters])
  const resetFilters = () => setFilters(emptyProgramFilters)

  return (
    <>
      <PageHeader
        title="Danh sách chương trình phụng vụ"
        breadcrumb={[{ title: 'Ca trưởng' }, { title: 'Chương trình phụng vụ' }]}
        description="Chọn chương trình để đề xuất danh sách bài hát và theo dõi kết quả duyệt."
      />
      {programs.isPending && <SectionSkeleton rows={6} label="Đang tải danh sách chương trình" />}
      {programs.isError && (
        <ErrorState
          title="Không thể tải danh sách chương trình"
          onRetry={() => programs.refetch()}
          retrying={programs.isFetching}
        />
      )}
      {programs.isSuccess && all.length === 0 && (
        <EmptyState
          title="Chưa có chương trình phụng vụ nào"
          description="Chương trình do Cha xứ / Ban phụng vụ tạo sẽ xuất hiện tại đây."
        />
      )}
      {programs.isSuccess && all.length > 0 && (
        <Card styles={{ body: { padding: 0 } }}>
          <ProgramFilterBar value={filters} onChange={setFilters} onReset={resetFilters} resultCount={visible.length} />
          {visible.length === 0 ? (
            <div style={{ padding: `0 ${spacing.md}px ${spacing.md}px` }}>
              <NoFilterResults onClearFilters={resetFilters} />
            </div>
          ) : (
            <ProgramTable
              programs={visible}
              onOpen={(program) => navigate(generatePath(paths.director.programDetail, { programId: program.id }))}
            />
          )}
        </Card>
      )}
    </>
  )
}
