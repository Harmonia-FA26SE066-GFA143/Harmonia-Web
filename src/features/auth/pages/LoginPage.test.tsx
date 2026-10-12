import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { env } from '@/config/env'
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
  delete window.google
  Object.assign(env, { googleClientId: '' })
})

/** Google Identity Services stand-in: keeps the callback and draws a plain button. */
function fakeGoogle() {
  let callback: (response: { credential?: string }) => void = () => {}
  const initialize = vi.fn((config: { client_id: string; callback: typeof callback }) => {
    callback = config.callback
  })
  const renderButton = vi.fn((parent: HTMLElement) => {
    parent.innerHTML = '<button type="button">Đăng nhập bằng Google</button>'
  })
  window.google = { accounts: { id: { initialize, renderButton } } }
  return { initialize, signInAs: (credential: string) => act(() => callback({ credential })) }
}

describe('LoginPage', () => {
  it('opens the workspace of the signed-in role', async () => {
    vi.spyOn(authApi, 'signIn').mockResolvedValue({ role: 'director', mustChangePassword: false })
    renderPage(<LoginPage />, '/login')

    submitCredentials()
    expect(await screen.findByTestId('location')).toHaveTextContent('/director')
  })

  it('sends an account with the emailed first password to change it', async () => {
    vi.spyOn(authApi, 'signIn').mockResolvedValue({ role: 'director', mustChangePassword: true })
    renderPage(<LoginPage />, '/login')

    submitCredentials()
    expect(await screen.findByTestId('location')).toHaveTextContent('/change-password')
  })

  it('points a Choir Member to the mobile app', async () => {
    vi.spyOn(authApi, 'signIn').mockResolvedValue({ role: 'member', mustChangePassword: false })
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

  it('hides the Google button while no client id is configured', () => {
    renderPage(<LoginPage />, '/login')

    expect(screen.queryByText('hoặc')).toBeNull()
  })

  it('signs in with the Google token and opens the workspace', async () => {
    Object.assign(env, { googleClientId: 'web-client-id' })
    const google = fakeGoogle()
    const signIn = vi.spyOn(authApi, 'signInWithGoogle').mockResolvedValue({ role: 'admin', mustChangePassword: false })
    renderPage(<LoginPage />, '/login')

    expect(await screen.findByRole('button', { name: 'Đăng nhập bằng Google' })).toBeInTheDocument()
    expect(google.initialize).toHaveBeenCalledWith(expect.objectContaining({ client_id: 'web-client-id' }))
    google.signInAs('google-id-token')

    await waitFor(() => expect(signIn).toHaveBeenCalledWith('google-id-token', expect.anything()))
    expect(await screen.findByTestId('location')).toHaveTextContent('/admin')
  })

  it('explains a Google account that has no Harmonia account', async () => {
    Object.assign(env, { googleClientId: 'web-client-id' })
    const google = fakeGoogle()
    vi.spyOn(authApi, 'signInWithGoogle').mockRejectedValue(new ApiError(401, { code: 'AUTH_INVALID_CREDENTIALS' }))
    renderPage(<LoginPage />, '/login')

    await screen.findByRole('button', { name: 'Đăng nhập bằng Google' })
    google.signInAs('google-id-token')

    expect(await screen.findByText('Tài khoản Google này chưa được cấp quyền vào Harmonia.')).toBeInTheDocument()
  })
})
