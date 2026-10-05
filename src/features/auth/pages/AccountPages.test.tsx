import { fireEvent, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api/errors'
import { renderPage } from '@/test/renderPage'
import * as authApi from '../api/authApi'
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
    vi.spyOn(authApi, 'resetPassword').mockRejectedValue(new ApiError(400, { code: 'AUTH_PASSWORD_TOO_WEAK' }))
    renderReset()

    submit('Matkhau123')
    expect(await screen.findByText('Mật khẩu cần ít nhất 8 ký tự, gồm cả chữ và số.')).toBeInTheDocument()
    expect(screen.getByLabelText('Mật khẩu mới')).toHaveValue('Matkhau123')
  })

  it('offers a retry when the server cannot be reached', async () => {
    vi.spyOn(authApi, 'resetPassword').mockRejectedValue(new TypeError('Failed to fetch'))
    renderReset()

    submit('Matkhau123')
    expect(await screen.findByText('Không thể đặt lại mật khẩu')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument()
  })
})
