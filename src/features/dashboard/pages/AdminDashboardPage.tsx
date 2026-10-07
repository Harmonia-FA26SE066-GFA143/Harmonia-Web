import { Button, Card, Flex, Typography } from 'antd'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { ActivityTable, useActivityLog } from '@/features/activity-log'
import { EmptyState, ErrorState, PageHeader, SectionSkeleton } from '@/shared/ui'
import { spacing } from '@/styles/tokens'
import { AdminShortcuts } from '../components/AdminShortcuts'

const recentLimit = 5

function SectionTitle({ id, children, extra }: { id: string; children: string; extra?: ReactNode }) {
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
 * Admin dashboard: shortcuts to each Admin area and the latest activity (FE-47–FE-54).
 * Each section loads and fails independently. Dashboard-wide metrics are not shown: none are defined (TBD).
 * No pending-accounts card: accounts are created by the Admin and never wait for confirmation (D1, 2026-10-07).
 */
export function AdminDashboardPage() {
  const navigate = useNavigate()
  const log = useActivityLog()
  const recent = (log.data ?? []).slice(0, recentLimit)

  return (
    <>
      <PageHeader
        title="Tổng quan"
        breadcrumb={[{ title: 'Quản trị hệ thống' }, { title: 'Tổng quan' }]}
        description="Quản lý tài khoản, cấu hình và theo dõi hoạt động của hệ thống Harmonia."
      />
      <Flex vertical gap={spacing.xl}>
        <section aria-labelledby="admin-shortcuts-heading">
          <SectionTitle id="admin-shortcuts-heading">Truy cập nhanh</SectionTitle>
          <AdminShortcuts />
        </section>

        <section aria-labelledby="recent-activity-heading">
          <SectionTitle
            id="recent-activity-heading"
            extra={<Button onClick={() => navigate(paths.admin.activityLog)}>Xem tất cả</Button>}
          >
            Hoạt động gần đây
          </SectionTitle>
          {log.isPending && <SectionSkeleton rows={5} label="Đang tải hoạt động gần đây" />}
          {log.isError && (
            <ErrorState title="Không thể tải hoạt động gần đây" onRetry={() => log.refetch()} retrying={log.isFetching} />
          )}
          {log.isSuccess && recent.length === 0 && (
            <EmptyState
              title="Chưa có hoạt động nào"
              description="Các hoạt động sẽ được hệ thống tự động ghi lại và hiển thị tại đây."
            />
          )}
          {recent.length > 0 && (
            <Card styles={{ body: { padding: 0 } }}>
              <ActivityTable records={recent} pageSize={recentLimit} />
            </Card>
          )}
        </section>
      </Flex>
    </>
  )
}
