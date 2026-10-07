import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api/errors'
import type { PagedList } from '@/lib/api/paging'
import { clearSession, setSession } from '@/lib/auth/session'
import { renderPage } from '@/test/renderPage'
import * as accountsApi from '../api/accountsApi'
import type { Account } from '../types'
import { AccountsPage } from './AccountsPage'

const account = (id: string, fullName: string, email: string, role: Account['role'], isActive = true): Account => ({
  id,
  fullName,
  email,
  phone: null,
  role,
  isActive,
  isPasswordChangeRequired: false,
})

const accounts: Account[] = [
  account('a1', 'Quản trị viên', 'admin@giaoxu.org', 'admin'),
  { ...account('a2', 'Giuse Trần Minh Tâm', 'tam@giaoxu.org', 'director'), phone: '0901 234 567' },
  account('a3', 'Phêrô Lê Văn Bình', 'binh@giaoxu.org', 'member', false),
  { ...account('a4', '', 'moi@giaoxu.org', 'member'), isPasswordChangeRequired: true },
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

  it('lists accounts with role, phone, status and the total count', async () => {
    renderAccounts()

    expect(await screen.findByText('Giuse Trần Minh Tâm')).toBeInTheDocument()
    expect(screen.getByText('Ca trưởng')).toBeInTheDocument()
    expect(screen.getByText('0901 234 567')).toBeInTheDocument()
    expect(screen.getByText('Ngừng hoạt động', { selector: '.ant-tag' })).toBeInTheDocument()
    expect(screen.getByText('4 tài khoản')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ngừng hoạt động Quản trị viên' })).toBeNull()
  })

  it('names an account by email while its name is empty and flags the pending first password', async () => {
    renderAccounts()

    expect(await screen.findByText('Chưa có họ tên')).toBeInTheDocument()
    expect(screen.getByText('Chưa đổi mật khẩu lần đầu')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sửa moi@giaoxu.org' })).toBeInTheDocument()
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

  it('creates an account with only email and role required; the backend emails the first password', async () => {
    renderAccounts()
    const create = vi.spyOn(accountsApi, 'createAccount').mockResolvedValue(accounts[1])

    fireEvent.click(await screen.findByRole('button', { name: /Tạo tài khoản/ }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).queryByLabelText(/Mật khẩu/)).toBeNull()
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Email' }), { target: { value: 'mai@giaoxu.org' } })
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Họ và tên (không bắt buộc)' }), {
      target: { value: ' Anna Mai ' },
    })
    fireEvent.mouseDown(within(dialog).getByRole('combobox'))
    fireEvent.click(await screen.findByTitle('Ca viên'))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Tạo tài khoản' }))

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({ email: 'mai@giaoxu.org', fullName: 'Anna Mai', phone: undefined, role: 'member' }),
    )
  })

  it('validates email and role when creating an account', async () => {
    renderAccounts()
    const create = vi.spyOn(accountsApi, 'createAccount')

    fireEvent.click(await screen.findByRole('button', { name: /Tạo tài khoản/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Email' }), { target: { value: 'sai-email' } })
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Số điện thoại (không bắt buộc)' }), {
      target: { value: '0'.repeat(21) },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Tạo tài khoản' }))

    expect(await within(dialog).findByText('Email không hợp lệ.')).toBeInTheDocument()
    expect(within(dialog).getByText('Số điện thoại tối đa 20 ký tự.')).toBeInTheDocument()
    expect(within(dialog).getByText('Vui lòng chọn vai trò.')).toBeInTheDocument()
    expect(create).not.toHaveBeenCalled()
  })

  it('edits email, name and phone and explains a taken email under the field', async () => {
    renderAccounts()
    const update = vi
      .spyOn(accountsApi, 'updateAccount')
      .mockRejectedValue(new ApiError(409, { code: 'USER_EMAIL_ALREADY_EXISTS' }))

    fireEvent.click(await screen.findByRole('button', { name: 'Sửa Giuse Trần Minh Tâm' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).queryByRole('combobox')).toBeNull()
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Email' }), { target: { value: 'binh@giaoxu.org' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu thay đổi' }))

    // PUT replaces every field, so the current phone is sent back unchanged.
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith('a2', {
        email: 'binh@giaoxu.org',
        fullName: 'Giuse Trần Minh Tâm',
        phone: '0901 234 567',
      }),
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
    renderAccounts([...accounts, account('a5', 'Admin Hai', 'hai@giaoxu.org', 'admin')])
    vi.spyOn(accountsApi, 'setAccountActive').mockRejectedValue(new ApiError(409, { code: 'USER_LAST_ADMIN' }))

    fireEvent.click(await screen.findByRole('button', { name: 'Ngừng hoạt động Admin Hai' }))
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Ngừng hoạt động' }))

    expect(await screen.findByText('Hệ thống cần ít nhất một Quản trị viên đang hoạt động.')).toBeInTheDocument()
  })
})
