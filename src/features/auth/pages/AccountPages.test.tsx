import { fireEvent, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderPage } from '@/test/renderPage'
import * as authApi from '../api/authApi'
import { ForgotPasswordPage } from './ForgotPasswordPage'

afterEach(() => {
  vi.restoreAllMocks()
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
