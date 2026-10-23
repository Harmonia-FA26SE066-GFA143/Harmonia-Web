import { Card } from 'antd'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { EmptyState, ErrorState, NoFilterResults, PageHeader, SectionSkeleton } from '@/shared/ui'
import { spacing } from '@/styles/tokens'
import { emptyActivityFilters, hasActiveActivityFilters, readActivityState, toActivityQuery, writeActivityState } from '../activityFilters'
import { ActivityDetailModal } from '../components/ActivityDetailModal'
import { ActivityFilterBar } from '../components/ActivityFilterBar'
import { ActivityTable } from '../components/ActivityTable'
import { useActivityLog } from '../hooks/useActivityLog'
import type { ActivityFilters, ActivityRecord } from '../types'

const pageSize = 20

/**
 * Admin: every change the backend records (FE-54, `GET /api/audit-logs`): who changed which data, when, and the
 * values before and after. Filters and paging run on the server.
 */
export function ActivityLogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { filters, page } = useMemo(() => readActivityState(searchParams), [searchParams])
  const [selected, setSelected] = useState<ActivityRecord>()
  const log = useActivityLog(toActivityQuery(filters), { pageNumber: page, pageSize })
  const total = log.data?.totalCount ?? 0
  const filtered = hasActiveActivityFilters(filters)

  // Filters and page are in the URL, so reload and the back button keep them.
  const changeFilters = (next: ActivityFilters) => setSearchParams(writeActivityState(next, 1), { replace: true })
  const setPage = (next: number) => setSearchParams(writeActivityState(filters, next), { replace: true })
  const resetFilters = () => changeFilters(emptyActivityFilters)

  return (
    <>
      <PageHeader
        title="Lịch sử hoạt động"
        breadcrumb={[{ title: 'Quản trị hệ thống' }, { title: 'Lịch sử hoạt động' }]}
        description="Theo dõi ai đã thay đổi dữ liệu nào, khi nào, cùng giá trị trước và sau thay đổi."
      />

      {log.isPending && <SectionSkeleton rows={8} label="Đang tải lịch sử hoạt động" />}
      {log.isError && (
        <ErrorState title="Không thể tải lịch sử hoạt động" error={log.error} hasData={log.data !== undefined} onRetry={() => log.refetch()} retrying={log.isFetching} />
      )}
      {log.data !== undefined && total === 0 && !filtered && (
        <EmptyState
          title="Chưa có hoạt động nào"
          description="Các hoạt động sẽ được hệ thống tự động ghi lại và hiển thị tại đây."
        />
      )}
      {log.data !== undefined && (total > 0 || filtered) && (
        <Card styles={{ body: { padding: 0 } }}>
          <ActivityFilterBar value={filters} onChange={changeFilters} onReset={resetFilters} resultCount={total} />
          {total === 0 ? (
            <div style={{ padding: `0 ${spacing.md}px ${spacing.md}px` }}>
              <NoFilterResults onClearFilters={resetFilters} />
            </div>
          ) : (
            <ActivityTable
              records={log.data.items}
              loading={log.isPlaceholderData}
              onShowDetail={setSelected}
              onPickUser={(user) => changeFilters({ ...filters, user })}
              pagination={{
                current: page,
                pageSize,
                total,
                hideOnSinglePage: true,
                showSizeChanger: false,
                onChange: setPage,
              }}
            />
          )}
        </Card>
      )}

      <ActivityDetailModal record={selected} onClose={() => setSelected(undefined)} />
    </>
  )
}
