import { fireEvent, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
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
  it('reports that sign-in is unavailable while the auth API contract is missing', async () => {
    renderPage(<LoginPage />, '/login')

    submitCredentials()
    expect(await screen.findByText('Không thể đăng nhập lúc này')).toBeInTheDocument()
  })

  it('sends an account awaiting confirmation to the pending screen', async () => {
    vi.spyOn(authApi, 'signIn').mockResolvedValue({ status: 'pending' })
    renderPage(<LoginPage />, '/login')

    submitCredentials()
    expect(await screen.findByTestId('location')).toHaveTextContent('/pending-confirmation')
  })

  it('opens the workspace of the confirmed role', async () => {
    vi.spyOn(authApi, 'signIn').mockResolvedValue({ status: 'active', role: 'director' })
    renderPage(<LoginPage />, '/login')

    submitCredentials()
    expect(await screen.findByTestId('location')).toHaveTextContent('/director')
  })

  it('shows the rejection reason for a rejected account', async () => {
    vi.spyOn(authApi, 'signIn').mockResolvedValue({ status: 'rejected', reason: 'Trùng tài khoản' })
    renderPage(<LoginPage />, '/login')

    submitCredentials()
    expect(await screen.findByText('Lý do: Trùng tài khoản')).toBeInTheDocument()
  })
})
