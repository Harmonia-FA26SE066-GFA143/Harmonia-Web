import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api/errors'
import { clearSession, setSession } from '@/lib/auth/session'
import { renderPage } from '@/test/renderPage'
import * as authApi from '../api/authApi'
import { ChangePasswordPage } from './ChangePasswordPage'
import { ForgotPasswordPage } from './ForgotPasswordPage'
import { ResetPasswordPage } from './ResetPasswordPage'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ForgotPasswordPage', () => {
  it('shows a retryable error when the request fails', async () => {
    vi.spyOn(authApi, 'requestPasswordReset').mockRejectedValue(new TypeError('Failed to fetch'))
    renderPage(<ForgotPasswordPage />, '/forgot-password')

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'an@giaoxu.org' } })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }))

    expect(await screen.findByText('Không thể gửi yêu cầu')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument()
  })

  it('confirms the request without revealing whether the email exists', async () => {
    vi.spyOn(authApi, 'requestPasswordReset').mockResolvedValue()
    renderPage(<ForgotPasswordPage />, '/forgot-password')

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'an@giaoxu.org' } })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }))

    expect(await screen.findByRole('heading', { name: 'Yêu cầu đã được gửi' })).toBeInTheDocument()
    expect(screen.getByText(/Nếu email đã được đăng ký/)).toBeInTheDocument()
  })
})

describe('ResetPasswordPage', () => {
  const renderReset = (query = '?token=link-token') =>
    renderPage(<ResetPasswordPage />, '/reset-password', `/reset-password${query}`)

  function submit(newPassword: string, confirmPassword = newPassword) {
    fireEvent.change(screen.getByLabelText('Mật khẩu mới'), { target: { value: newPassword } })
    fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu'), { target: { value: confirmPassword } })
    fireEvent.click(screen.getByRole('button', { name: 'Đặt lại mật khẩu' }))
  }

  it('explains that a link without a token cannot be used', async () => {
    renderReset('')
    expect(await screen.findByRole('heading', { name: 'Liên kết không còn hiệu lực' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Yêu cầu liên kết mới' }))
    expect(await screen.findByTestId('location')).toHaveTextContent('/forgot-password')
  })

  it('checks the password rule and the confirmation before sending', async () => {
    const reset = vi.spyOn(authApi, 'resetPassword')
    renderReset()

    submit('password', 'password')
    expect(await screen.findByText('Mật khẩu cần ít nhất 8 ký tự, gồm cả chữ và số.')).toBeInTheDocument()
    submit('Matkhau123', 'Matkhau124')
    expect(await screen.findByText('Mật khẩu xác nhận không khớp.')).toBeInTheDocument()
    expect(reset).not.toHaveBeenCalled()
  })

  it('sends the token with the new password and offers sign-in', async () => {
    const reset = vi.spyOn(authApi, 'resetPassword').mockResolvedValue()
    renderReset()

    submit('Matkhau123')
    expect(await screen.findByRole('heading', { name: 'Đã đặt lại mật khẩu' })).toBeInTheDocument()
    expect(reset.mock.calls[0][0]).toEqual({ token: 'link-token', newPassword: 'Matkhau123' })
  })

  it('treats an expired, used or unknown token as an unusable link', async () => {
    vi.spyOn(authApi, 'resetPassword').mockRejectedValue(new ApiError(400, { code: 'AUTH_RESET_TOKEN_EXPIRED' }))
    renderReset()

    submit('Matkhau123')
    expect(await screen.findByRole('heading', { name: 'Liên kết không còn hiệu lực' })).toBeInTheDocument()
  })

  it('shows a password the backend rejects under the field and keeps the input', async () => {
    vi.spyOn(authApi, 'resetPassword').mockRejectedValue(
      new ApiError(400, { code: 'VALIDATION_FAILED', errors: { newPassword: ['AUTH_PASSWORD_TOO_WEAK'] } }),
    )
    renderReset()

    submit('Matkhau123')
    expect(await screen.findByText('Mật khẩu cần ít nhất 8 ký tự, gồm cả chữ và số.')).toBeInTheDocument()
    expect(screen.getByLabelText('Mật khẩu mới')).toHaveValue('Matkhau123')
    expect(screen.queryByText('Không thể đặt lại mật khẩu')).toBeNull()
  })

  it('offers a retry when the server cannot be reached', async () => {
    vi.spyOn(authApi, 'resetPassword').mockRejectedValue(new TypeError('Failed to fetch'))
    renderReset()

    submit('Matkhau123')
    expect(await screen.findByText('Không thể đặt lại mật khẩu')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument()
  })
})

describe('ChangePasswordPage', () => {
  function signIn(isPasswordChangeRequired: boolean) {
    setSession({
      accessToken: 'access',
      accessTokenExpiresAt: '2099-01-01T00:00:00Z',
      refreshToken: 'refresh',
      user: { id: 'u1', email: 'an@giaoxu.org', roleName: 'ChoirDirector', isPasswordChangeRequired },
    })
  }

  function submit(currentPassword: string, newPassword: string) {
    fireEvent.change(screen.getByLabelText('Mật khẩu hiện tại'), { target: { value: currentPassword } })
    fireEvent.change(screen.getByLabelText('Mật khẩu mới'), { target: { value: newPassword } })
    fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu'), { target: { value: newPassword } })
    fireEvent.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }))
  }

  afterEach(() => clearSession())

  it('needs a signed-in user', async () => {
    renderPage(<ChangePasswordPage />, '/change-password')
    expect(await screen.findByTestId('location')).toHaveTextContent('/login')
  })

  it('asks for a new password before anything else and signs the user out afterwards', async () => {
    signIn(true)
    const change = vi.spyOn(authApi, 'changePassword').mockResolvedValue()
    renderPage(<ChangePasswordPage />, '/change-password')

    expect(screen.getByText(/mật khẩu được gửi qua email/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Đăng xuất' })).toBeInTheDocument()
    submit('EmailPass12', 'Matkhau123')

    await waitFor(() => expect(change.mock.calls[0]?.[0]).toEqual({ currentPassword: 'EmailPass12', newPassword: 'Matkhau123' }))
    expect(await screen.findByRole('heading', { name: 'Đã đổi mật khẩu' })).toBeInTheDocument()
  })

  it('links back to the profile when the change is voluntary', () => {
    signIn(false)
    renderPage(<ChangePasswordPage />, '/change-password')

    expect(screen.getByRole('link', { name: 'Quay lại hồ sơ cá nhân' })).toHaveAttribute('href', '/profile')
  })

  it('points at the current password when the backend rejects it', async () => {
    signIn(true)
    vi.spyOn(authApi, 'changePassword').mockRejectedValue(new ApiError(400, { code: 'AUTH_CURRENT_PASSWORD_INVALID' }))
    renderPage(<ChangePasswordPage />, '/change-password')

    submit('sai-mat-khau', 'Matkhau123')
    expect(await screen.findByText('Mật khẩu hiện tại không đúng.')).toBeInTheDocument()
  })

  it('shows the password rule when the backend finds the new password weak', async () => {
    signIn(true)
    vi.spyOn(authApi, 'changePassword').mockRejectedValue(
      new ApiError(400, { code: 'VALIDATION_FAILED', errors: { newPassword: ['AUTH_PASSWORD_TOO_WEAK'] } }),
    )
    renderPage(<ChangePasswordPage />, '/change-password')

    submit('EmailPass12', 'Matkhau123')
    expect(await screen.findByText('Mật khẩu cần ít nhất 8 ký tự, gồm cả chữ và số.')).toBeInTheDocument()
    expect(screen.queryByText('Không thể đổi mật khẩu')).toBeNull()
  })
})
