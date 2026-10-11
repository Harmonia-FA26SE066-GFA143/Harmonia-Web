import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api/errors'
import { renderPage } from '@/test/renderPage'
import * as profileApi from '../api/profileApi'
import { ProfilePage } from './ProfilePage'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ProfilePage', () => {
  it('shows a recoverable error when the profile cannot be loaded', async () => {
    vi.spyOn(profileApi, 'getMyProfile').mockRejectedValue(new ApiError(403, undefined))
    renderPage(<ProfilePage />, '/profile')

    expect(screen.getByRole('status', { name: 'Đang tải hồ sơ cá nhân' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Không thể tải hồ sơ cá nhân' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Thử lại/ })).toBeInTheDocument()
  })

  it('renders the loaded profile', async () => {
    vi.spyOn(profileApi, 'getMyProfile').mockResolvedValue({
      fullName: 'Nguyễn Văn An',
      email: 'an@giaoxu.org',
      role: 'priest',
    })
    renderPage(<ProfilePage />, '/profile')

    expect(await screen.findByText('Nguyễn Văn An')).toBeInTheDocument()
    expect(screen.getByText('Cha xứ / Ban phụng vụ')).toBeInTheDocument()
  })

  it('moves the focus into the form when editing and back to the edit button when leaving it', async () => {
    vi.spyOn(profileApi, 'getMyProfile').mockResolvedValue({ fullName: 'Nguyễn Văn An', email: 'an@giaoxu.org', role: 'priest' })
    const save = vi
      .spyOn(profileApi, 'updateMyProfile')
      .mockResolvedValue({ fullName: 'An Nguyễn', email: 'an@giaoxu.org', role: 'priest' })
    renderPage(<ProfilePage />, '/profile')

    fireEvent.click(await screen.findByRole('button', { name: /Chỉnh sửa/ }))
    expect(screen.getByLabelText('Họ và tên (không bắt buộc)')).toHaveFocus()

    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }))
    await waitFor(() => expect(screen.getByRole('button', { name: /Chỉnh sửa/ })).toHaveFocus())

    fireEvent.click(screen.getByRole('button', { name: /Chỉnh sửa/ }))
    fireEvent.change(screen.getByLabelText('Họ và tên (không bắt buộc)'), { target: { value: 'An Nguyễn' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(screen.getByRole('button', { name: /Chỉnh sửa/ })).toHaveFocus())
  })

  it('asks for confirmation before signing out', async () => {
    vi.spyOn(profileApi, 'getMyProfile').mockRejectedValue(new ApiError(403, undefined))
    renderPage(<ProfilePage />, '/profile')

    fireEvent.click(screen.getByRole('button', { name: /Đăng xuất/ }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Đăng xuất khỏi Harmonia?')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Ở lại' })).toBeInTheDocument()
  })
})
