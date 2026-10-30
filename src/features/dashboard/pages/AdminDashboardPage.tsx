import { Button, Card, Flex, Typography } from 'antd'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { ActivityTable, useActivityLog } from '@/features/activity-log'
import { EmptyState, ErrorState, PageHeader, SectionSkeleton } from '@/shared/ui'
import { spacing } from '@/styles/tokens'

// Enough rows to fill the first screen, which now holds only this list.
const recentLimit = 10

function SectionTitle({ id, children, extra }: Readonly<{ id: string; children: string; extra?: ReactNode }>) {
  return (
    <Flex wrap align="center" justify="space-between" gap={spacing.sm} style={{ marginBottom: spacing.md }}>
      <Typography.Title id={id} level={2} style={{ margin: 0 }}>
        {children}
      </Typography.Title>
      {extra}
    </Flex>
  )
}

/**
 * Admin dashboard: the latest activity (FE-47–FE-54); each Admin area is in the sidebar, so no shortcut cards (#244). Dashboard-wide metrics are not shown: none are defined (TBD).
 * No pending-accounts card: accounts are created by the Admin and never wait for confirmation (D1, 2026-10-07).
 */
export function AdminDashboardPage() {
  const navigate = useNavigate()
  const log = useActivityLog({}, { pageNumber: 1, pageSize: recentLimit })
  const recent = log.data?.items ?? []

  return (
    <>
      <PageHeader
        title="Tổng quan"
        breadcrumb={[{ title: 'Quản trị hệ thống' }, { title: 'Tổng quan' }]}
      />
      <Flex vertical gap={spacing.xl}>
        <section aria-labelledby="recent-activity-heading">
          <SectionTitle
            id="recent-activity-heading"
            extra={<Button onClick={() => navigate(paths.admin.activityLog)}>Xem tất cả</Button>}
          >
            Hoạt động gần đây
          </SectionTitle>
          {log.isPending && <SectionSkeleton rows={recentLimit} label="Đang tải hoạt động gần đây" />}
          {log.isError && (
            <ErrorState headingLevel={3} title="Không thể tải hoạt động gần đây" error={log.error} hasData={log.data !== undefined} onRetry={() => log.refetch()} retrying={log.isFetching} />
          )}
          {log.data !== undefined && recent.length === 0 && (
            <EmptyState
              headingLevel={3}
              title="Chưa có hoạt động nào"
              description="Các hoạt động sẽ được hệ thống tự động ghi lại và hiển thị tại đây."
            />
          )}
          {recent.length > 0 && (
            <Card styles={{ body: { padding: 0 } }}>
              <ActivityTable records={recent} />
            </Card>
          )}
        </section>
      </Flex>
    </>
  )
}
