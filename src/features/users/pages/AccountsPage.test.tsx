import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api/errors'
import type { PagedList } from '@/lib/api/paging'
import { clearSession, setSession } from '@/lib/auth/session'
import { renderPage } from '@/test/renderPage'
import * as accountsApi from '../api/accountsApi'
import type { Account } from '../types'
import { AccountsPage } from './AccountsPage'

const accounts: Account[] = [
  { id: 'a1', fullName: 'Quản trị viên', email: 'admin@giaoxu.org', role: 'admin', isActive: true },
  { id: 'a2', fullName: 'Giuse Trần Minh Tâm', email: 'tam@giaoxu.org', role: 'director', isActive: true },
  { id: 'a3', fullName: 'Phêrô Lê Văn Bình', email: 'binh@giaoxu.org', role: 'member', isActive: false },
]

const page = (items: Account[]): PagedList<Account> => ({
  items,
  pageNumber: 1,
  pageSize: 20,
  totalCount: items.length,
  totalPages: items.length ? 1 : 0,
})

afterEach(() => {
  vi.restoreAllMocks()
  clearSession()
})

function renderAccounts(data: Account[] = accounts) {
  // Signed in as the first account, so its own row has no deactivate action.
  setSession({
    accessToken: 'access',
    accessTokenExpiresAt: '2099-01-01T00:00:00Z',
    refreshToken: 'refresh',
    user: { id: 'a1', email: 'admin@giaoxu.org', roleName: 'Admin' },
  })
  vi.spyOn(accountsApi, 'listAccounts').mockResolvedValue(page(data))
  renderPage(<AccountsPage />, '/admin/accounts')
}

describe('AccountsPage', () => {
  it('shows a recoverable error when the accounts cannot be loaded', async () => {
    vi.spyOn(accountsApi, 'listAccounts').mockRejectedValue(new ApiError(403, undefined))
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

  it('lists accounts with role, status and the total count', async () => {
    renderAccounts()

    expect(await screen.findByText('Giuse Trần Minh Tâm')).toBeInTheDocument()
    expect(screen.getByText('Ca trưởng')).toBeInTheDocument()
    expect(screen.getByText('Ngừng hoạt động', { selector: '.ant-tag' })).toBeInTheDocument()
    expect(screen.getByText('3 tài khoản')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ngừng hoạt động Quản trị viên' })).toBeNull()
  })

  it('searches by email on the server and distinguishes no results', async () => {
    renderAccounts()
    const list = vi.mocked(accountsApi.listAccounts).mockImplementation(async (filters) =>
      page(filters.search ? [] : accounts),
    )

    fireEvent.change(await screen.findByRole('textbox', { name: 'Tìm tài khoản theo email' }), {
      target: { value: 'không-tồn-tại' },
    })
    expect(await screen.findByRole('heading', { name: 'Không tìm thấy kết quả phù hợp' })).toBeInTheDocument()
    expect(list).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'không-tồn-tại' }),
      expect.objectContaining({ pageNumber: 1, pageSize: 20 }),
    )
  })

  it('creates an account with an initial password and a role', async () => {
    renderAccounts()
    const create = vi.spyOn(accountsApi, 'createAccount').mockResolvedValue(accounts[1])

    fireEvent.click(await screen.findByRole('button', { name: /Tạo tài khoản/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Họ và tên' }), { target: { value: ' Anna Mai ' } })
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Email' }), { target: { value: 'mai@giaoxu.org' } })
    fireEvent.change(within(dialog).getByLabelText('Mật khẩu ban đầu'), { target: { value: 'matkhau123' } })
    fireEvent.mouseDown(within(dialog).getByRole('combobox'))
    fireEvent.click(await screen.findByTitle('Ca viên'))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Tạo tài khoản' }))

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        fullName: 'Anna Mai',
        email: 'mai@giaoxu.org',
        password: 'matkhau123',
        role: 'member',
      }),
    )
  })

  it('validates required fields and the password length when creating an account', async () => {
    renderAccounts()
    const create = vi.spyOn(accountsApi, 'createAccount')

    fireEvent.click(await screen.findByRole('button', { name: /Tạo tài khoản/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Email' }), { target: { value: 'sai-email' } })
    fireEvent.change(within(dialog).getByLabelText('Mật khẩu ban đầu'), { target: { value: 'ngan' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Tạo tài khoản' }))

    expect(await within(dialog).findByText('Vui lòng nhập họ và tên.')).toBeInTheDocument()
    expect(within(dialog).getByText('Email không hợp lệ.')).toBeInTheDocument()
    expect(within(dialog).getByText('Mật khẩu cần ít nhất 8 ký tự.')).toBeInTheDocument()
    expect(within(dialog).getByText('Vui lòng chọn vai trò.')).toBeInTheDocument()
    expect(create).not.toHaveBeenCalled()
  })

  it('edits name and email and explains a taken email under the field', async () => {
    renderAccounts()
    const update = vi
      .spyOn(accountsApi, 'updateAccount')
      .mockRejectedValue(new ApiError(409, { code: 'USER_EMAIL_ALREADY_EXISTS' }))

    fireEvent.click(await screen.findByRole('button', { name: 'Sửa Giuse Trần Minh Tâm' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).queryByLabelText('Mật khẩu ban đầu')).toBeNull()
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Email' }), { target: { value: 'binh@giaoxu.org' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith('a2', { fullName: 'Giuse Trần Minh Tâm', email: 'binh@giaoxu.org' }),
    )
    expect(await within(dialog).findByText('Email này đã được dùng cho tài khoản khác.')).toBeInTheDocument()
  })

  it('deactivates and reactivates accounts after confirmation', async () => {
    renderAccounts()
    const setActive = vi.spyOn(accountsApi, 'setAccountActive').mockResolvedValue()

    fireEvent.click(await screen.findByRole('button', { name: 'Ngừng hoạt động Giuse Trần Minh Tâm' }))
    const deactivate = (await screen.findAllByText('Ngừng hoạt động tài khoản?'))[0].closest('.ant-modal') as HTMLElement
    fireEvent.click(within(deactivate).getByRole('button', { name: 'Ngừng hoạt động' }))
    await waitFor(() => expect(setActive).toHaveBeenCalledWith('a2', false))

    fireEvent.click(screen.getByRole('button', { name: 'Kích hoạt Phêrô Lê Văn Bình' }))
    const activate = (await screen.findAllByText('Kích hoạt lại tài khoản?'))[0].closest('.ant-modal') as HTMLElement
    fireEvent.click(within(activate).getByRole('button', { name: 'Kích hoạt' }))
    await waitFor(() => expect(setActive).toHaveBeenCalledWith('a3', true))
  })

  it('explains why the last Admin cannot be deactivated', async () => {
    renderAccounts([...accounts, { id: 'a4', fullName: 'Admin Hai', email: 'hai@giaoxu.org', role: 'admin', isActive: true }])
    vi.spyOn(accountsApi, 'setAccountActive').mockRejectedValue(new ApiError(409, { code: 'USER_LAST_ADMIN' }))

    fireEvent.click(await screen.findByRole('button', { name: 'Ngừng hoạt động Admin Hai' }))
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Ngừng hoạt động' }))

    expect(await screen.findByText('Hệ thống cần ít nhất một Quản trị viên đang hoạt động.')).toBeInTheDocument()
  })
})
