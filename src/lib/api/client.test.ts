import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getSession, setSession, type Session } from '@/lib/auth/session'
import { apiRequest } from './client'
import { ApiError } from './errors'

const session = (token: string): Session => ({
  accessToken: `access-${token}`,
  accessTokenExpiresAt: '2026-10-03T10:00:00Z',
  refreshToken: `refresh-${token}`,
  user: { id: 'u1', email: 'an@giaoxu.org', roleName: 'ChoirDirector' },
})

const reply = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status })

const fetchMock = vi.fn<typeof fetch>()
const assign = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('location', { assign })
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
  assign.mockReset()
})

const authorization = (call: number) => new Headers(fetchMock.mock.calls[call][1]?.headers).get('Authorization')

describe('apiRequest', () => {
  it('sends the stored access token', async () => {
    setSession(session('1'))
    fetchMock.mockResolvedValueOnce(reply(200, { ok: true }))

    await expect(apiRequest('/api/songs')).resolves.toEqual({ ok: true })
    expect(authorization(0)).toBe('Bearer access-1')
  })

  it('exposes the backend error code and field errors', async () => {
    fetchMock.mockResolvedValueOnce(
      reply(400, { code: 'VALIDATION_FAILED', message: 'x', errors: { title: ['SONG_TITLE_REQUIRED'] } }),
    )

    const error = await apiRequest('/api/songs').catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 400, code: 'VALIDATION_FAILED', errors: { title: ['SONG_TITLE_REQUIRED'] } })
  })

  it('refreshes an expired token once, stores the rotated token and retries', async () => {
    setSession(session('1'))
    fetchMock
      .mockResolvedValueOnce(reply(401, { code: 'AUTH_TOKEN_EXPIRED' }))
      .mockResolvedValueOnce(reply(200, session('2')))
      .mockResolvedValueOnce(reply(200, { ok: true }))

    await expect(apiRequest('/api/songs')).resolves.toEqual({ ok: true })
    expect(fetchMock.mock.calls[1][0]).toMatch(/\/api\/auth\/refresh$/)
    expect(fetchMock.mock.calls[1][1]?.body).toBe(JSON.stringify({ refreshToken: 'refresh-1' }))
    expect(authorization(2)).toBe('Bearer access-2')
    expect(getSession()?.refreshToken).toBe('refresh-2')
  })

  it('ends the session and returns to sign-in when the refresh token is rejected', async () => {
    setSession(session('1'))
    fetchMock
      .mockResolvedValueOnce(reply(401, { code: 'AUTH_TOKEN_EXPIRED' }))
      .mockResolvedValueOnce(reply(401, { code: 'AUTH_REFRESH_TOKEN_REVOKED' }))

    await expect(apiRequest('/api/songs')).rejects.toMatchObject({ status: 401, code: 'AUTH_TOKEN_EXPIRED' })
    expect(getSession()).toBeUndefined()
    expect(assign).toHaveBeenCalledWith('/login')
  })

  it('does not refresh for an invalid token', async () => {
    setSession(session('1'))
    fetchMock.mockResolvedValueOnce(reply(401, { code: 'AUTH_TOKEN_INVALID' }))

    await expect(apiRequest('/api/songs')).rejects.toMatchObject({ code: 'AUTH_TOKEN_INVALID' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
