import { SwapOutlined } from '@ant-design/icons'
import { App, Button, Card, Flex, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { getSession } from '@/lib/auth/session'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import type { SystemRole } from '@/shared/types/account'
import { EmptyState, ErrorState, NoFilterResults, PageHeader, SectionSkeleton } from '@/shared/ui'
import { spacing } from '@/styles/tokens'
import { accountErrorMessage } from '../accountErrors'
import { emptyAccountFilters, hasActiveFilters } from '../accountFilters'
import { AccountFilterBar } from '../components/AccountFilterBar'
import { AccountTable } from '../components/AccountTable'
import { AssignRoleModal } from '../components/AssignRoleModal'
import { RoleSummary } from '../components/RoleSummary'
import { useAccounts, useChangeAccountRole, useRoleCounts } from '../hooks/useAccounts'
import { accountName, type Account, type AccountFilters } from '../types'

const pageSize = 20

/**
 * Admin: role assignment (FE-48) on `PUT /api/users/{id}/role`. Every account holds exactly one role. Fine-grained
 * permissions are not configurable (Report 1 does not define them; UNRESOLVED).
 */
export function RolesPage() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [filters, setFilters] = useState<AccountFilters>(emptyAccountFilters)
  const [page, setPage] = useState(1)
  const search = useDebouncedValue(filters.search)
  const query = useMemo(() => ({ ...filters, search }), [filters, search])
  const accounts = useAccounts(query, { pageNumber: page, pageSize })
  const counts = useRoleCounts()
  const changeRole = useChangeAccountRole()
  const [changing, setChanging] = useState<Account>()
  const ownId = getSession()?.user.id

  const total = accounts.data?.totalCount ?? 0
  const filtered = hasActiveFilters(query)
  const changeFilters = (next: AccountFilters) => {
    setFilters(next)
    setPage(1)
  }
  const resetFilters = () => changeFilters(emptyAccountFilters)

  const handleChangeRole = (role: SystemRole) => {
    if (!changing) return
    changeRole.mutate(
      { id: changing.id, role },
      {
        onSuccess: () => {
          message.success(`Đã thay đổi vai trò của ${accountName(changing)}.`)
          setChanging(undefined)
        },
        onError: (error) => message.error(accountErrorMessage(error, 'Không thể thay đổi vai trò. Vui lòng thử lại.')),
      },
    )
  }

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
            {total === 0 && !filtered ? (
              <EmptyState
                title="Chưa có tài khoản nào"
                description="Tạo tài khoản ở trang Tài khoản trước."
                action={<Button onClick={() => navigate(paths.admin.accounts)}>Đến trang Tài khoản</Button>}
              />
            ) : (
              <Card styles={{ body: { padding: 0 } }}>
                <AccountFilterBar value={filters} onChange={changeFilters} onReset={resetFilters} resultCount={total} />
                {total === 0 ? (
                  <div style={{ padding: `0 ${spacing.md}px ${spacing.md}px` }}>
                    <NoFilterResults onClearFilters={resetFilters} />
                  </div>
                ) : (
                  <AccountTable
                    accounts={accounts.data.items}
                    page={page}
                    pageSize={pageSize}
                    total={total}
                    loading={accounts.isPlaceholderData}
                    onPageChange={setPage}
                    // The backend refuses to change the Admin's own role (USER_CANNOT_MODIFY_SELF).
                    renderActions={(account) =>
                      account.id !== ownId && (
                        <Button
                          icon={<SwapOutlined />}
                          onClick={() => setChanging(account)}
                          aria-label={`Thay đổi vai trò của ${accountName(account)}`}
                        >
                          Thay đổi vai trò
                        </Button>
                      )
                    }
                  />
                )}
              </Card>
            )}
          </section>
        </Flex>
      )}

      <AssignRoleModal
        account={changing}
        saving={changeRole.isPending}
        onSubmit={handleChangeRole}
        onCancel={() => setChanging(undefined)}
      />
    </>
  )
}
