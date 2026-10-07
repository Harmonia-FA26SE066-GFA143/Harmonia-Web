import { UserAddOutlined } from '@ant-design/icons'
import { App, Button, Card, Flex } from 'antd'
import { useMemo, useState } from 'react'
import { getSession } from '@/lib/auth/session'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { EmptyState, ErrorState, NoFilterResults, PageHeader, SectionSkeleton } from '@/shared/ui'
import { spacing } from '@/styles/tokens'
import { accountErrorMessage, duplicateEmailMessage, isDuplicateEmail } from '../accountErrors'
import { emptyAccountFilters, hasActiveFilters } from '../accountFilters'
import { AccountFilterBar } from '../components/AccountFilterBar'
import { AccountFormModal } from '../components/AccountFormModal'
import { AccountTable } from '../components/AccountTable'
import { useAccounts, useCreateAccount, useSetAccountActive, useUpdateAccount } from '../hooks/useAccounts'
import { accountName, type Account, type AccountFilters, type CreateAccountValues, type UpdateAccountValues } from '../types'

const pageSize = 20

/**
 * Admin: user accounts (FE-47) on `/api/users`. The Admin creates accounts with a role (the backend emails a
 * generated first password), edits email, name and phone, and deactivates or reactivates them (owner decision D1,
 * 2026-10-07: follow the BE). Roles are changed on the Roles page.
 */
export function AccountsPage() {
  const { message, modal } = App.useApp()
  const [filters, setFilters] = useState<AccountFilters>(emptyAccountFilters)
  const [page, setPage] = useState(1)
  const search = useDebouncedValue(filters.search)
  const query = useMemo(() => ({ ...filters, search }), [filters, search])
  const accounts = useAccounts(query, { pageNumber: page, pageSize })
  const create = useCreateAccount()
  const update = useUpdateAccount()
  const setActive = useSetAccountActive()

  // `account` is set while editing; `open` without it means creating.
  const [form, setForm] = useState<{ open: boolean; account?: Account }>({ open: false })
  const [emailError, setEmailError] = useState<string>()
  const ownId = getSession()?.user.id

  const total = accounts.data?.totalCount ?? 0
  const filtered = hasActiveFilters(query)
  const changeFilters = (next: AccountFilters) => {
    setFilters(next)
    setPage(1)
  }
  const resetFilters = () => changeFilters(emptyAccountFilters)
  const closeForm = () => {
    setForm({ open: false })
    setEmailError(undefined)
  }

  const handleSubmit = (values: CreateAccountValues | UpdateAccountValues) => {
    setEmailError(undefined)
    const callbacks = {
      onSuccess: () => {
        message.success(form.account ? 'Đã lưu thay đổi.' : 'Đã tạo tài khoản.')
        closeForm()
      },
      onError: (error: Error) =>
        isDuplicateEmail(error)
          ? setEmailError(duplicateEmailMessage)
          : message.error(accountErrorMessage(error, 'Không thể lưu tài khoản. Vui lòng thử lại.')),
    }
    if (form.account) update.mutate({ id: form.account.id, values }, callbacks)
    else create.mutate(values as CreateAccountValues, callbacks)
  }

  const handleToggleActive = (account: Account) => {
    const active = !account.isActive
    modal.confirm({
      title: active ? 'Kích hoạt lại tài khoản?' : 'Ngừng hoạt động tài khoản?',
      content: active
        ? `${accountName(account)} sẽ đăng nhập lại được.`
        : `${accountName(account)} sẽ bị đăng xuất và không đăng nhập được cho tới khi được kích hoạt lại.`,
      okText: active ? 'Kích hoạt' : 'Ngừng hoạt động',
      okButtonProps: { danger: !active },
      cancelText: 'Hủy',
      onOk: () =>
        setActive
          .mutateAsync({ id: account.id, active })
          .then(() => message.success(active ? 'Đã kích hoạt tài khoản.' : 'Đã ngừng hoạt động tài khoản.'))
          .catch((error: Error) =>
            message.error(accountErrorMessage(error, 'Không thể cập nhật trạng thái. Vui lòng thử lại.')),
          ),
    })
  }

  const renderActions = (account: Account) => (
    <Flex gap={spacing.xs} justify="flex-end">
      <Button onClick={() => setForm({ open: true, account })} aria-label={`Sửa ${accountName(account)}`}>
        Sửa
      </Button>
      {/* The backend refuses to deactivate the Admin's own account (USER_CANNOT_MODIFY_SELF). */}
      {account.id !== ownId && (
        <Button
          danger={account.isActive}
          onClick={() => handleToggleActive(account)}
          aria-label={`${account.isActive ? 'Ngừng hoạt động' : 'Kích hoạt'} ${accountName(account)}`}
        >
          {account.isActive ? 'Ngừng hoạt động' : 'Kích hoạt'}
        </Button>
      )}
    </Flex>
  )

  const createButton = (
    <Button type="primary" icon={<UserAddOutlined />} onClick={() => setForm({ open: true })}>
      Tạo tài khoản
    </Button>
  )

  return (
    <>
      <PageHeader
        title="Tài khoản"
        breadcrumb={[{ title: 'Quản trị hệ thống' }, { title: 'Tài khoản' }]}
        description="Tạo và quản lý tài khoản người dùng của hệ thống."
        extra={createButton}
      />

      {accounts.isPending && <SectionSkeleton rows={6} label="Đang tải danh sách tài khoản" />}
      {accounts.isError && (
        <ErrorState
          title="Không thể tải danh sách tài khoản"
          onRetry={() => accounts.refetch()}
          retrying={accounts.isFetching}
        />
      )}
      {accounts.isSuccess && total === 0 && !filtered && (
        <EmptyState
          title="Chưa có tài khoản nào"
          description="Tài khoản bạn tạo sẽ xuất hiện tại đây."
          action={createButton}
        />
      )}
      {accounts.isSuccess && (total > 0 || filtered) && (
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
              renderActions={renderActions}
            />
          )}
        </Card>
      )}

      <AccountFormModal
        open={form.open}
        account={form.account}
        saving={create.isPending || update.isPending}
        emailError={emailError}
        onSubmit={handleSubmit}
        onCancel={closeForm}
      />
    </>
  )
}
