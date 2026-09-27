import { SwapOutlined } from '@ant-design/icons'
import { App, Button, Card, Flex, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import type { SystemRole } from '@/shared/types/account'
import { EmptyState, ErrorState, NoFilterResults, PageHeader, SectionSkeleton } from '@/shared/ui'
import { spacing } from '@/styles/tokens'
import { emptyAccountFilters, filterAccounts } from '../accountFilters'
import { AccountFilterBar } from '../components/AccountFilterBar'
import { AccountTable } from '../components/AccountTable'
import { AssignRoleModal } from '../components/AssignRoleModal'
import { RoleSummary } from '../components/RoleSummary'
import { useAccounts, useChangeAccountRole } from '../hooks/useAccounts'
import { assignableRoles } from '../roles'
import type { Account, AccountFilters } from '../types'

/**
 * Admin: role assignment (FE-48). Lists accounts that already hold a role; pending accounts get their
 * first role through confirmation on the Accounts page. Fine-grained permissions are not configurable
 * (Report 1 does not define them; UNRESOLVED).
 */
export function RolesPage() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const accounts = useAccounts()
  const changeRole = useChangeAccountRole()
  const [filters, setFilters] = useState<AccountFilters>(emptyAccountFilters)
  const [changing, setChanging] = useState<Account>()

  const withRole = useMemo(() => (accounts.data ?? []).filter((account) => account.role), [accounts.data])
  const visible = useMemo(() => filterAccounts(withRole, filters), [withRole, filters])
  const counts = useMemo(
    () =>
      Object.fromEntries(
        assignableRoles.map((role) => [role, withRole.filter((account) => account.role === role).length]),
      ) as Record<SystemRole, number>,
    [withRole],
  )
  const resetFilters = () => setFilters(emptyAccountFilters)

  const handleChangeRole = (role: SystemRole) => {
    if (!changing) return
    changeRole.mutate(
      { id: changing.id, role },
      {
        onSuccess: () => {
          message.success(`Đã thay đổi vai trò của ${changing.fullName}.`)
          setChanging(undefined)
        },
        onError: () => message.error('Không thể thay đổi vai trò. Vui lòng thử lại.'),
      },
    )
  }

  const goToAccounts = (
    <Button onClick={() => navigate(paths.admin.accounts)}>Đến trang Tài khoản</Button>
  )

  return (
    <>
      <PageHeader
        title="Vai trò & Phân quyền"
        breadcrumb={[{ title: 'Quản trị hệ thống' }, { title: 'Vai trò & Phân quyền' }]}
        description="Gán vai trò hệ thống cho tài khoản. Chức năng mỗi người dùng được sử dụng tuân theo vai trò được gán."
      />

      {accounts.isPending && <SectionSkeleton rows={6} label="Đang tải vai trò và tài khoản" />}
      {accounts.isError && (
        <ErrorState
          title="Không thể tải vai trò và tài khoản"
          onRetry={() => accounts.refetch()}
          retrying={accounts.isFetching}
        />
      )}
      {accounts.isSuccess && (
        <Flex vertical gap={spacing.lg}>
          <RoleSummary counts={counts} />
          <section aria-labelledby="role-assignment-heading">
            <Typography.Title id="role-assignment-heading" level={2} style={{ margin: `0 0 ${spacing.md}px` }}>
              Gán vai trò cho tài khoản
            </Typography.Title>
            {withRole.length === 0 ? (
              <EmptyState
                title="Chưa có tài khoản nào được gán vai trò"
                description="Tài khoản tự đăng ký cần được xác nhận vai trò ở trang Tài khoản trước."
                action={goToAccounts}
              />
            ) : (
              <Card styles={{ body: { padding: 0 } }}>
                <AccountFilterBar
                  value={filters}
                  onChange={setFilters}
                  onReset={resetFilters}
                  resultCount={visible.length}
                  showStatusFilter={false}
                />
                {visible.length === 0 ? (
                  <div style={{ padding: `0 ${spacing.md}px ${spacing.md}px` }}>
                    <NoFilterResults onClearFilters={resetFilters} />
                  </div>
                ) : (
                  <AccountTable
                    accounts={visible}
                    renderActions={(account) => (
                      <Button
                        icon={<SwapOutlined />}
                        onClick={() => setChanging(account)}
                        aria-label={`Thay đổi vai trò của ${account.fullName}`}
                      >
                        Thay đổi vai trò
                      </Button>
                    )}
                  />
                )}
              </Card>
            )}
          </section>
        </Flex>
      )}

      <AssignRoleModal
        mode="change"
        account={changing}
        saving={changeRole.isPending}
        onSubmit={handleChangeRole}
        onCancel={() => setChanging(undefined)}
      />
    </>
  )
}
