import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api/errors'
import type { PagedList } from '@/lib/api/paging'
import type { SystemRole } from '@/shared/types/account'
import { renderPage } from '@/test/renderPage'
import * as accountsApi from '../api/accountsApi'
import type { Account } from '../types'
import { RolesPage } from './RolesPage'

const accounts: Account[] = [
  { id: 'a1', fullName: 'Giuse Trần Minh Tâm', email: 'tam@giaoxu.org', phone: null, role: 'director', isActive: true, isPasswordChangeRequired: false },
  { id: 'a2', fullName: 'Têrêsa Lê Hoàng Vy', email: 'vy@giaoxu.org', phone: null, role: 'member', isActive: true, isPasswordChangeRequired: false },
  { id: 'a3', fullName: 'Simon Phan Văn Đức', email: 'duc@giaoxu.org', phone: null, role: 'member', isActive: false, isPasswordChangeRequired: false },
]

const page = (items: Account[]): PagedList<Account> => ({
  items,
  pageNumber: 1,
  pageSize: 20,
  totalCount: items.length,
  totalPages: items.length ? 1 : 0,
})

const counts: Record<SystemRole, number> = { priest: 1, director: 1, member: 2, admin: 1 }

afterEach(() => {
  vi.restoreAllMocks()
})

function renderRoles(data: Account[] = accounts) {
  vi.spyOn(accountsApi, 'listAccounts').mockResolvedValue(page(data))
  vi.spyOn(accountsApi, 'countAccounts').mockImplementation(async (role) => counts[role])
  renderPage(<RolesPage />, '/admin/roles')
}

describe('RolesPage', () => {
  it('shows a recoverable error when the accounts cannot be loaded', async () => {
    vi.spyOn(accountsApi, 'listAccounts').mockRejectedValue(new ApiError(403, undefined))
    vi.spyOn(accountsApi, 'countAccounts').mockRejectedValue(new ApiError(403, undefined))
    renderPage(<RolesPage />, '/admin/roles')

    expect(await screen.findByRole('heading', { name: 'Không thể tải vai trò và tài khoản' })).toBeInTheDocument()
  })

  it('summarises the four FE-48 roles with their account counts and lists the accounts', async () => {
    renderRoles()

    const heading = await screen.findByRole('heading', { level: 3, name: 'Ca viên' })
    await waitFor(() => expect(heading.closest('.ant-card')).toHaveTextContent('Đang gán: 2 tài khoản'))
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(4)
    expect(screen.getByText('Giuse Trần Minh Tâm')).toBeInTheDocument()
  })

  it('points to the Accounts page when there is no account', async () => {
    renderRoles([])

    fireEvent.click(await screen.findByRole('button', { name: 'Đến trang Tài khoản' }))
    expect(await screen.findByTestId('location')).toHaveTextContent('/admin/accounts')
  })

  it('changes a role only after a different role is chosen', async () => {
    renderRoles()
    const change = vi.spyOn(accountsApi, 'changeAccountRole').mockResolvedValue({ ...accounts[0], role: 'priest' })

    fireEvent.click(await screen.findByRole('button', { name: 'Thay đổi vai trò của Giuse Trần Minh Tâm' }))
    const dialog = await screen.findByRole('dialog')
    const save = within(dialog).getByRole('button', { name: 'Lưu thay đổi' })
    expect(within(dialog).getByRole('radio', { name: /Ca trưởng/ })).toBeChecked()
    expect(save).toBeDisabled()

    fireEvent.click(within(dialog).getByRole('radio', { name: /Cha xứ/ }))
    await waitFor(() => expect(save).toBeEnabled())
    fireEvent.click(save)

    await waitFor(() => expect(change).toHaveBeenCalledWith('a1', 'priest'))
  })
})
