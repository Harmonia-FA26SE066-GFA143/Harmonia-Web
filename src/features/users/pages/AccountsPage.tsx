import { UserAddOutlined } from '@ant-design/icons'
import { Alert, App, Button, Card, Flex, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { accountStatusLabels, type AccountStatus, type SystemRole } from '@/shared/types/account'
import { EmptyState, ErrorState, NoFilterResults, PageHeader, SectionSkeleton } from '@/shared/ui'
import { colors, spacing } from '@/styles/tokens'
import { emptyAccountFilters, filterAccounts } from '../accountFilters'
import { AccountFilterBar } from '../components/AccountFilterBar'
import { AccountTable } from '../components/AccountTable'
import { AssignRoleModal } from '../components/AssignRoleModal'
import { CreateAccountModal } from '../components/CreateAccountModal'
import { RejectAccountModal } from '../components/RejectAccountModal'
import {
  useAccounts,
  useConfirmAccount,
  useCreateAccount,
  useRejectAccount,
  useReopenAccount,
} from '../hooks/useAccounts'
import type { Account, AccountFilters, CreateAccountValues } from '../types'

/**
 * Admin: user accounts (FE-47) with the self-registration review flow (DECIDED 2026-09-26):
 * pending accounts are found through the "Chờ xác nhận" filter, then confirmed with a role or rejected;
 * rejected accounts can be reopened. Deactivation is a conceptual status only – no action is defined (TBD).
 * `?status=pending` opens the page pre-filtered (used by the Admin dashboard's pending-accounts card).
 */
export function AccountsPage() {
  const { message, modal } = App.useApp()
  const accounts = useAccounts()
  const create = useCreateAccount()
  const confirm = useConfirmAccount()
  const reject = useRejectAccount()
  const reopen = useReopenAccount()

  const [searchParams] = useSearchParams()
  const [filters, setFilters] = useState<AccountFilters>(() => {
    const status = searchParams.get('status')
    return status && status in accountStatusLabels
      ? { ...emptyAccountFilters, status: status as AccountStatus }
      : emptyAccountFilters
  })
  const [creating, setCreating] = useState(false)
  const [confirming, setConfirming] = useState<Account>()
  const [rejecting, setRejecting] = useState<Account>()

  const all = accounts.data ?? []
  const visible = useMemo(() => filterAccounts(accounts.data ?? [], filters), [accounts.data, filters])
  const pendingCount = all.filter((account) => account.status === 'pending').length
  const resetFilters = () => setFilters(emptyAccountFilters)

  const handleCreate = (values: CreateAccountValues) =>
    create.mutate(values, {
      onSuccess: () => {
        message.success('Đã tạo tài khoản.')
        setCreating(false)
      },
      // TBD: a duplicate email cannot be told apart until the backend error format is known.
      onError: () => message.error('Không thể tạo tài khoản. Vui lòng thử lại.'),
    })

  const handleConfirm = (role: SystemRole) => {
    if (!confirming) return
    confirm.mutate(
      { id: confirming.id, role },
      {
        onSuccess: () => {
          message.success(`Đã xác nhận tài khoản của ${confirming.fullName}.`)
          setConfirming(undefined)
        },
        onError: () => message.error('Không thể xác nhận tài khoản. Vui lòng thử lại.'),
      },
    )
  }

  const handleReject = (reason?: string) => {
    if (!rejecting) return
    reject.mutate(
      { id: rejecting.id, reason },
      {
        onSuccess: () => {
          message.success(`Đã từ chối tài khoản của ${rejecting.fullName}.`)
          setRejecting(undefined)
        },
        onError: () => message.error('Không thể từ chối tài khoản. Vui lòng thử lại.'),
      },
    )
  }

  const handleReopen = (account: Account) =>
    modal.confirm({
      title: 'Mở lại tài khoản?',
      content: `Tài khoản của ${account.fullName} (${account.email}) sẽ được mở lại.`,
      okText: 'Mở lại',
      cancelText: 'Hủy',
      onOk: () =>
        reopen
          .mutateAsync(account.id)
          .then(() => message.success(`Đã mở lại tài khoản của ${account.fullName}.`))
          .catch(() => message.error('Không thể mở lại tài khoản. Vui lòng thử lại.')),
    })

  const renderActions = (account: Account) => {
    if (account.status === 'pending') {
      return (
        <Flex gap={spacing.xs} justify="flex-end">
          <Button type="primary" onClick={() => setConfirming(account)} aria-label={`Xác nhận ${account.fullName}`}>
            Xác nhận
          </Button>
          <Button danger onClick={() => setRejecting(account)} aria-label={`Từ chối ${account.fullName}`}>
            Từ chối
          </Button>
        </Flex>
      )
    }
    if (account.status === 'rejected') {
      return (
        <Button onClick={() => handleReopen(account)} aria-label={`Mở lại ${account.fullName}`}>
          Mở lại
        </Button>
      )
    }
    return <Typography.Text style={{ color: colors.textMuted }}>—</Typography.Text>
  }

  const createButton = (
    <Button type="primary" icon={<UserAddOutlined />} onClick={() => setCreating(true)}>
      Tạo tài khoản
    </Button>
  )

  return (
    <>
      <PageHeader
        title="Tài khoản"
        breadcrumb={[{ title: 'Quản trị hệ thống' }, { title: 'Tài khoản' }]}
        description="Quản lý tài khoản người dùng và xác nhận vai trò cho tài khoản tự đăng ký."
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
      {accounts.isSuccess && all.length === 0 && (
        <EmptyState
          title="Chưa có tài khoản nào"
          description="Tài khoản tự đăng ký và tài khoản do bạn tạo sẽ xuất hiện tại đây."
          action={createButton}
        />
      )}
      {accounts.isSuccess && all.length > 0 && (
        <Flex vertical gap={spacing.md}>
          {pendingCount > 0 && filters.status !== 'pending' && (
            <Alert
              type="warning"
              showIcon
              title={`Có ${pendingCount} tài khoản đang chờ xác nhận vai trò.`}
              action={
                <Button size="small" onClick={() => setFilters({ ...emptyAccountFilters, status: 'pending' })}>
                  Xem tài khoản chờ xác nhận
                </Button>
              }
            />
          )}
          <Card styles={{ body: { padding: 0 } }}>
            <AccountFilterBar
              value={filters}
              onChange={setFilters}
              onReset={resetFilters}
              resultCount={visible.length}
            />
            {visible.length === 0 ? (
              <div style={{ padding: `0 ${spacing.md}px ${spacing.md}px` }}>
                <NoFilterResults onClearFilters={resetFilters} />
              </div>
            ) : (
              <AccountTable accounts={visible} renderActions={renderActions} />
            )}
          </Card>
        </Flex>
      )}

      <CreateAccountModal
        open={creating}
        saving={create.isPending}
        onSubmit={handleCreate}
        onCancel={() => setCreating(false)}
      />
      <AssignRoleModal
        mode="confirm"
        account={confirming}
        saving={confirm.isPending}
        onSubmit={handleConfirm}
        onCancel={() => setConfirming(undefined)}
      />
      <RejectAccountModal
        account={rejecting}
        saving={reject.isPending}
        onSubmit={handleReject}
        onCancel={() => setRejecting(undefined)}
      />
    </>
  )
}
