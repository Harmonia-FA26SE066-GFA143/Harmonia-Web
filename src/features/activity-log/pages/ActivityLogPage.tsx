import { Card } from 'antd'
import { useMemo, useState } from 'react'
import { EmptyState, ErrorState, NoFilterResults, PageHeader, SectionSkeleton } from '@/shared/ui'
import { spacing } from '@/styles/tokens'
import { emptyActivityFilters, filterActivities } from '../activityFilters'
import { ActivityDetailModal } from '../components/ActivityDetailModal'
import { ActivityFilterBar } from '../components/ActivityFilterBar'
import { ActivityTable } from '../components/ActivityTable'
import { useActivityLog } from '../hooks/useActivityLog'
import type { ActivityFilters, ActivityRecord } from '../types'

/** Admin: history of role changes, approvals, roster confirmation, attendance updates and deletions (FE-54). */
export function ActivityLogPage() {
  const log = useActivityLog()
  const [filters, setFilters] = useState<ActivityFilters>(emptyActivityFilters)
  const [selected, setSelected] = useState<ActivityRecord>()

  const records = useMemo(() => log.data ?? [], [log.data])
  const visible = useMemo(() => filterActivities(records, filters), [records, filters])
  const actorNames = useMemo(
    () => [...new Set(records.map((record) => record.actorName))].sort((a, b) => a.localeCompare(b, 'vi')),
    [records],
  )
  const resetFilters = () => setFilters(emptyActivityFilters)

  return (
    <>
      <PageHeader
        title="Lịch sử hoạt động"
        breadcrumb={[{ title: 'Quản trị hệ thống' }, { title: 'Lịch sử hoạt động' }]}
        description="Theo dõi thay đổi vai trò, duyệt kỹ năng, duyệt danh sách bài hát, xác nhận phân công, cập nhật điểm danh và xoá tài liệu."
      />

      {log.isPending && <SectionSkeleton rows={8} label="Đang tải lịch sử hoạt động" />}
      {log.isError && (
        <ErrorState title="Không thể tải lịch sử hoạt động" onRetry={() => log.refetch()} retrying={log.isFetching} />
      )}
      {log.isSuccess && records.length === 0 && (
        <EmptyState
          title="Chưa có hoạt động nào"
          description="Các hoạt động sẽ được hệ thống tự động ghi lại và hiển thị tại đây."
        />
      )}
      {log.isSuccess && records.length > 0 && (
        <Card styles={{ body: { padding: 0 } }}>
          <ActivityFilterBar
            value={filters}
            onChange={setFilters}
            onReset={resetFilters}
            actorNames={actorNames}
            resultCount={visible.length}
          />
          {visible.length === 0 ? (
            <div style={{ padding: `0 ${spacing.md}px ${spacing.md}px` }}>
              <NoFilterResults onClearFilters={resetFilters} />
            </div>
          ) : (
            <ActivityTable records={visible} onShowDetail={setSelected} />
          )}
        </Card>
      )}

      <ActivityDetailModal record={selected} onClose={() => setSelected(undefined)} />
    </>
  )
}
