import { PlusOutlined } from '@ant-design/icons'
import { Button, Card } from 'antd'
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

/** Priest: liturgical programs of the parish with filters (FE-15). */
export function PriestProgramListPage() {
  const navigate = useNavigate()
  const programs = usePrograms()
  const [filters, setFilters] = useState<ProgramFilters>(emptyProgramFilters)
  const all = useMemo(() => programs.data ?? [], [programs.data])
  const visible = useMemo(() => filterPrograms(all, filters), [all, filters])
  const resetFilters = () => setFilters(emptyProgramFilters)

  const createButton = (
    <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(paths.priest.programCreate)}>
      Tạo chương trình
    </Button>
  )

  return (
    <>
      <PageHeader
        title="Danh sách chương trình phụng vụ"
        breadcrumb={[{ title: 'Cha xứ' }, { title: 'Chương trình phụng vụ' }]}
        description="Theo dõi các chương trình phụng vụ và tình trạng danh sách bài hát của từng chương trình."
        extra={createButton}
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
          description="Tạo chương trình đầu tiên để Ca trưởng chuẩn bị danh sách bài hát."
          action={createButton}
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
              onOpen={(program) => navigate(generatePath(paths.priest.programDetail, { programId: program.id }))}
            />
          )}
        </Card>
      )}
    </>
  )
}
