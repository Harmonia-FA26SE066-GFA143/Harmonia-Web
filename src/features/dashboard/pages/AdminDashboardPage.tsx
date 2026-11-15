import { Flex } from 'antd'
import { useState } from 'react'
import { Link } from 'react-router'
import { paths } from '@/app/router/paths'
import { ActivityDetailDrawer, ActivityTable, useActivityLog, type ActivityRecord } from '@/features/activity-log'
import { useWaitingRegistrationCount } from '@/features/member-registrations'
import { useRoleCounts } from '@/features/users'
import { roleLabels, type SystemRole } from '@/shared/types/account'
import { EmptyState, ErrorState, PageHeader, SectionSkeleton, SummaryStrip } from '@/shared/ui'
import { spacing } from '@/styles/tokens'
import { TodaySeason } from '../components/TodaySeason'

// Enough rows to fill the first screen.
const recentLimit = 10
const roleOrder: SystemRole[] = ['priest', 'director', 'member', 'admin']

/**
 * Admin dashboard (artifact AdminDashboard): today's season, accounts per role and the join requests waiting, then the
 * latest activity (FE-47–FE-54). Each Admin area is in the running head, so no shortcut cards (#244). No other
 * metrics: the BE defines none. No pending-accounts card: accounts are created by the Admin (D1, 2026-10-07).
 */
export function AdminDashboardPage() {
  const log = useActivityLog({}, { pageNumber: 1, pageSize: recentLimit })
  const recent = log.data?.items ?? []
  const counts = useRoleCounts()
  const waiting = useWaitingRegistrationCount()
  const [selected, setSelected] = useState<ActivityRecord>()

  return (
    <>
      <PageHeader title="Tổng quan" description="Hoạt động của hệ thống và việc đang chờ bạn." />
      <Flex vertical gap={spacing.md}>
        {/* The Admin keeps the liturgical calendar in sync; every overview opens on the same season. */}
        <TodaySeason />
        <SummaryStrip
          label="Tài khoản theo vai trò và yêu cầu đang chờ"
          cells={[
            ...roleOrder.map((role) => ({ label: roleLabels[role], value: counts?.[role] })),
            { label: 'Đăng ký đang chờ', value: waiting, waiting: <Link to={paths.admin.memberRegistrations}>Xem yêu cầu</Link> },
          ]}
        />
        <section aria-labelledby="recent-activity-heading" className="hm-sheet-section">
          <header className="hm-sheet-section__head">
            <h2 id="recent-activity-heading" className="hm-rubric">
              Hoạt động gần đây
            </h2>
            <Link to={paths.admin.activityLog} className="hm-sheet-section__link">
              Xem tất cả
            </Link>
          </header>
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
          {recent.length > 0 && <ActivityTable records={recent} onShowDetail={setSelected} />}
        </section>
      </Flex>
      <ActivityDetailDrawer record={selected} onClose={() => setSelected(undefined)} />
    </>
  )
}
