import { PlusOutlined } from '@ant-design/icons'
import { Button, Card } from 'antd'
import { useState } from 'react'
import { generatePath, useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { EmptyState, ErrorState, NoFilterResults, PageHeader, SectionSkeleton } from '@/shared/ui'
import { spacing } from '@/styles/tokens'
import { EventFilterBar } from '../components/EventFilterBar'
import { EventTable } from '../components/EventTable'
import { useEvents } from '../hooks/useEvents'
import { hasActiveEventFilters } from '../programFilters'
import type { EventFilters } from '../types'

const pageSize = 20

/** Priest: liturgical events of the parish (FE-15) on `GET /api/liturgical-events`, filtered on the server. */
export function PriestProgramListPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<EventFilters>({})
  const [page, setPage] = useState(1)
  const events = useEvents(filters, { pageNumber: page, pageSize })

  const total = events.data?.totalCount ?? 0
  const filtered = hasActiveEventFilters(filters)
  const changeFilters = (next: EventFilters) => {
    setFilters(next)
    setPage(1)
  }
  const resetFilters = () => changeFilters({})

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
        description="Theo dõi các sự kiện phụng vụ, tạo bản nháp và công bố cho ca đoàn."
        extra={createButton}
      />
      {events.isPending && <SectionSkeleton rows={6} label="Đang tải danh sách chương trình" />}
      {events.isError && (
        <ErrorState title="Không thể tải danh sách chương trình" onRetry={() => events.refetch()} retrying={events.isFetching} />
      )}
      {events.isSuccess && total === 0 && !filtered && (
        <EmptyState
          title="Chưa có chương trình phụng vụ nào"
          description="Tạo sự kiện đầu tiên, rồi công bố để Ca trưởng bắt đầu chuẩn bị."
          action={createButton}
        />
      )}
      {events.isSuccess && (total > 0 || filtered) && (
        <Card styles={{ body: { padding: 0 } }}>
          <EventFilterBar value={filters} onChange={changeFilters} onReset={resetFilters} resultCount={total} />
          {total === 0 ? (
            <div style={{ padding: `0 ${spacing.md}px ${spacing.md}px` }}>
              <NoFilterResults onClearFilters={resetFilters} />
            </div>
          ) : (
            <EventTable
              events={events.data.items}
              loading={events.isPlaceholderData}
              pagination={{ current: page, pageSize, total, hideOnSinglePage: true, showSizeChanger: false, onChange: setPage }}
              onOpen={(event) => navigate(generatePath(paths.priest.programDetail, { programId: event.id }))}
            />
          )}
        </Card>
      )}
    </>
  )
}
