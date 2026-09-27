import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderPage } from '@/test/renderPage'
import * as accountsApi from '../api/accountsApi'
import type { Account } from '../types'
import { AccountsPage } from './AccountsPage'

const accounts: Account[] = [
  { id: 'a1', fullName: 'Giuse Trần Minh Tâm', email: 'tam@giaoxu.org', status: 'active', role: 'director' },
  {
    id: 'a2',
    fullName: 'Maria Nguyễn Thu Hướng',
    email: 'huong@giaoxu.org',
    status: 'pending',
    requestedRole: 'member',
  },
  {
    id: 'a3',
    fullName: 'Phêrô Lê Văn Bình',
    email: 'binh@giaoxu.org',
    status: 'rejected',
    requestedRole: 'priest',
    rejectionReason: 'Không thuộc giáo xứ',
  },
]

afterEach(() => {
  vi.restoreAllMocks()
})

function renderAccounts(data: Account[] = accounts) {
  vi.spyOn(accountsApi, 'listAccounts').mockResolvedValue(data)
  renderPage(<AccountsPage />, '/admin/accounts')
}

describe('AccountsPage', () => {
  it('shows a recoverable error while the accounts API contract is missing', async () => {
    renderPage(<AccountsPage />, '/admin/accounts')

    expect(screen.getByRole('status', { name: 'Đang tải danh sách tài khoản' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Không thể tải danh sách tài khoản' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Thử lại/ })).toBeInTheDocument()
  })

  it('shows the empty state with a create action', async () => {
    renderAccounts([])

    expect(await screen.findByRole('heading', { name: 'Chưa có tài khoản nào' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Tạo tài khoản/ }).length).toBeGreaterThan(0)
  })

  it('lists accounts with status, requested role and rejection reason', async () => {
    renderAccounts()

    expect(await screen.findByText('Giuse Trần Minh Tâm')).toBeInTheDocument()
    expect(screen.getByText('Đề nghị: Ca viên')).toBeInTheDocument()
    expect(screen.getByText('Lý do: Không thuộc giáo xứ')).toBeInTheDocument()
    expect(screen.getByText('3 tài khoản')).toBeInTheDocument()
  })

  it('surfaces pending accounts and filters to them', async () => {
    renderAccounts()

    fireEvent.click(await screen.findByRole('button', { name: 'Xem tài khoản chờ xác nhận' }))

    expect(screen.getByText('Maria Nguyễn Thu Hướng')).toBeInTheDocument()
    expect(screen.queryByText('Giuse Trần Minh Tâm')).toBeNull()
    expect(screen.getByText('1 tài khoản')).toBeInTheDocument()
  })

  it('opens pre-filtered to pending accounts from ?status=pending', async () => {
    vi.spyOn(accountsApi, 'listAccounts').mockResolvedValue(accounts)
    renderPage(<AccountsPage />, '/admin/accounts', '/admin/accounts?status=pending')

    expect(await screen.findByText('Maria Nguyễn Thu Hướng')).toBeInTheDocument()
    expect(screen.queryByText('Giuse Trần Minh Tâm')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Xem tài khoản chờ xác nhận' })).toBeNull()
  })

  it('shows no-results for a search without matches and clears it', async () => {
    renderAccounts()

    const search = await screen.findByRole('textbox', { name: 'Tìm tài khoản theo họ tên hoặc email' })
    fireEvent.change(search, { target: { value: 'không-tồn-tại' } })
    expect(screen.getByRole('heading', { name: 'Không tìm thấy kết quả phù hợp' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Xoá bộ lọc/ }))
    expect(screen.getByText('Giuse Trần Minh Tâm')).toBeInTheDocument()
  })

  it('confirms a pending account with the requested role preselected, allowing another role', async () => {
    renderAccounts()
    const confirm = vi.spyOn(accountsApi, 'confirmAccount').mockResolvedValue({ ...accounts[1], status: 'active' })

    fireEvent.click(await screen.findByRole('button', { name: 'Xác nhận Maria Nguyễn Thu Hướng' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('radio', { name: /Ca viên/ })).toBeChecked()
    expect(within(dialog).queryByRole('radio', { name: /Nhạc công/ })).toBeNull()

    fireEvent.click(within(dialog).getByRole('radio', { name: /Ca trưởng/ }))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Xác nhận' }))

    await waitFor(() => expect(confirm).toHaveBeenCalledWith('a2', 'director'))
  })

  it('rejects a pending account with an optional reason', async () => {
    renderAccounts()
    const reject = vi.spyOn(accountsApi, 'rejectAccount').mockResolvedValue({ ...accounts[1], status: 'rejected' })

    fireEvent.click(await screen.findByRole('button', { name: 'Từ chối Maria Nguyễn Thu Hướng' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Từ chối' }))

    await waitFor(() => expect(reject).toHaveBeenCalledWith('a2', undefined))
  })

  it('reopens a rejected account after confirmation', async () => {
    renderAccounts()
    const reopen = vi.spyOn(accountsApi, 'reopenAccount').mockResolvedValue({ ...accounts[2], status: 'pending' })

    fireEvent.click(await screen.findByRole('button', { name: 'Mở lại Phêrô Lê Văn Bình' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Mở lại' }))

    await waitFor(() => expect(reopen).toHaveBeenCalledWith('a3'))
  })

  it('validates required fields when creating an account', async () => {
    renderAccounts()
    const create = vi.spyOn(accountsApi, 'createAccount')

    fireEvent.click(await screen.findByRole('button', { name: /Tạo tài khoản/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Email' }), { target: { value: 'sai-email' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Tạo tài khoản' }))

    expect(await within(dialog).findByText('Vui lòng nhập họ và tên.')).toBeInTheDocument()
    expect(within(dialog).getByText('Email không hợp lệ.')).toBeInTheDocument()
    expect(within(dialog).getByText('Vui lòng chọn vai trò.')).toBeInTheDocument()
    expect(create).not.toHaveBeenCalled()
  })
})
