import { fireEvent, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api/errors'
import { renderPage } from '@/test/renderPage'
import * as authApi from '../api/authApi'
import { LoginPage } from './LoginPage'

function submitCredentials() {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'an@giaoxu.org' } })
  fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'bi-mat' } })
  fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('LoginPage', () => {
  it('opens the workspace of the signed-in role', async () => {
    vi.spyOn(authApi, 'signIn').mockResolvedValue({ role: 'director' })
    renderPage(<LoginPage />, '/login')

    submitCredentials()
    expect(await screen.findByTestId('location')).toHaveTextContent('/director')
  })

  it('points a Choir Member to the mobile app', async () => {
    vi.spyOn(authApi, 'signIn').mockResolvedValue({ role: 'member' })
    renderPage(<LoginPage />, '/login')

    submitCredentials()
    expect(await screen.findByText('Tài khoản Ca viên sử dụng ứng dụng di động Harmonia')).toBeInTheDocument()
  })

  it.each([
    [new ApiError(401, { code: 'AUTH_INVALID_CREDENTIALS' }), 'Email hoặc mật khẩu không chính xác.'],
    [new ApiError(403, { code: 'AUTH_ACCOUNT_INACTIVE' }), 'Tài khoản đã bị vô hiệu hoá'],
    [new ApiError(500, { code: 'INTERNAL_ERROR' }), 'Không thể đăng nhập lúc này'],
    [new TypeError('Failed to fetch'), 'Không thể đăng nhập lúc này'],
  ])('explains %s', async (error, text) => {
    vi.spyOn(authApi, 'signIn').mockRejectedValue(error)
    renderPage(<LoginPage />, '/login')

    submitCredentials()
    expect(await screen.findByText(text)).toBeInTheDocument()
  })
})
