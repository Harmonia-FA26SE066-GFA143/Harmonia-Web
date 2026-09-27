import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderPage } from '@/test/renderPage'
import * as accountsApi from '../api/accountsApi'
import type { Account } from '../types'
import { RolesPage } from './RolesPage'

const accounts: Account[] = [
  { id: 'a1', fullName: 'Giuse Trần Minh Tâm', email: 'tam@giaoxu.org', status: 'active', role: 'director' },
  { id: 'a2', fullName: 'Têrêsa Lê Hoàng Vy', email: 'vy@giaoxu.org', status: 'active', role: 'member' },
  { id: 'a3', fullName: 'Simon Phan Văn Đức', email: 'duc@giaoxu.org', status: 'active', role: 'member' },
  { id: 'a4', fullName: 'Maria Chờ Duyệt', email: 'cho@giaoxu.org', status: 'pending', requestedRole: 'member' },
]

afterEach(() => {
  vi.restoreAllMocks()
})

describe('RolesPage', () => {
  it('shows a recoverable error while the accounts API contract is missing', async () => {
    renderPage(<RolesPage />, '/admin/roles')

    expect(await screen.findByRole('heading', { name: 'Không thể tải vai trò và tài khoản' })).toBeInTheDocument()
  })

  it('summarises the four FE-48 roles and lists only accounts that hold a role', async () => {
    vi.spyOn(accountsApi, 'listAccounts').mockResolvedValue(accounts)
    renderPage(<RolesPage />, '/admin/roles')

    const heading = await screen.findByRole('heading', { level: 3, name: 'Ca viên' })
    expect(heading.closest('.ant-card')).toHaveTextContent('Đang gán: 2 tài khoản')
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(4)
    expect(screen.getByText('Giuse Trần Minh Tâm')).toBeInTheDocument()
    expect(screen.queryByText('Maria Chờ Duyệt')).toBeNull()
  })

  it('points to the Accounts page when no account holds a role yet', async () => {
    vi.spyOn(accountsApi, 'listAccounts').mockResolvedValue([accounts[3]])
    renderPage(<RolesPage />, '/admin/roles')

    fireEvent.click(await screen.findByRole('button', { name: 'Đến trang Tài khoản' }))
    expect(await screen.findByTestId('location')).toHaveTextContent('/admin/accounts')
  })

  it('changes a role only after a different role is chosen', async () => {
    vi.spyOn(accountsApi, 'listAccounts').mockResolvedValue(accounts)
    const change = vi.spyOn(accountsApi, 'changeAccountRole').mockResolvedValue({ ...accounts[0], role: 'priest' })
    renderPage(<RolesPage />, '/admin/roles')

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
