import { fireEvent, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderPage } from '@/test/renderPage'
import * as authApi from '../api/authApi'
import { ForgotPasswordPage } from './ForgotPasswordPage'
import { PendingConfirmationPage } from './PendingConfirmationPage'
import { RegisterPage } from './RegisterPage'

afterEach(() => {
  vi.restoreAllMocks()
})

function submitRegistration() {
  fireEvent.change(screen.getByLabelText('Họ và tên'), { target: { value: 'Nguyễn Văn An' } })
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'an@giaoxu.org' } })
  fireEvent.click(screen.getByLabelText('Ca viên'))
  fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'mat-khau-1' } })
  fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu'), { target: { value: 'mat-khau-1' } })
  fireEvent.click(screen.getByRole('button', { name: 'Đăng ký' }))
}

describe('RegisterPage', () => {
  it('confirms the registration is waiting for an Admin, without sending the confirmation field', async () => {
    const register = vi.spyOn(authApi, 'register').mockResolvedValue()
    renderPage(<RegisterPage />, '/register')

    submitRegistration()
    expect(await screen.findByRole('heading', { name: 'Đăng ký thành công' })).toBeInTheDocument()
    expect(register.mock.calls[0][0]).not.toHaveProperty('confirmPassword')
  })

  it('reports that registration is unavailable while the API contract is missing', async () => {
    renderPage(<RegisterPage />, '/register')

    submitRegistration()
    expect(await screen.findByText('Không thể đăng ký lúc này')).toBeInTheDocument()
  })
})

describe('ForgotPasswordPage', () => {
  it('shows a retryable error when the request fails', async () => {
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

describe('PendingConfirmationPage', () => {
  it('offers only the profile and sign-out', async () => {
    renderPage(<PendingConfirmationPage />, '/pending-confirmation')

    expect(screen.getByRole('heading', { name: 'Tài khoản đang chờ xác nhận' })).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: 'Xem hồ sơ cá nhân' }))
    expect(await screen.findByTestId('location')).toHaveTextContent('/profile')
  })
})
