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

  it('ends the session for a deactivated account', async () => {
    setSession(session('1'))
    fetchMock
      .mockResolvedValueOnce(reply(401, { code: 'AUTH_TOKEN_EXPIRED' }))
      .mockResolvedValueOnce(reply(403, { code: 'AUTH_ACCOUNT_INACTIVE' }))

    await expect(apiRequest('/api/songs')).rejects.toMatchObject({ status: 401 })
    expect(getSession()).toBeUndefined()
    expect(assign).toHaveBeenCalledWith('/login')
  })

  it('keeps the session when the refresh fails on the server', async () => {
    setSession(session('1'))
    fetchMock
      .mockResolvedValueOnce(reply(401, { code: 'AUTH_TOKEN_EXPIRED' }))
      .mockResolvedValueOnce(reply(500, { code: 'INTERNAL_ERROR' }))

    await expect(apiRequest('/api/songs')).rejects.toMatchObject({ status: 500, code: 'INTERNAL_ERROR' })
    expect(getSession()?.refreshToken).toBe('refresh-1')
    expect(assign).not.toHaveBeenCalled()
  })

  it('keeps the session when the refresh cannot reach the server', async () => {
    setSession(session('1'))
    fetchMock
      .mockResolvedValueOnce(reply(401, { code: 'AUTH_TOKEN_EXPIRED' }))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await expect(apiRequest('/api/songs')).rejects.toBeInstanceOf(TypeError)
    expect(getSession()?.refreshToken).toBe('refresh-1')
    expect(assign).not.toHaveBeenCalled()
  })

  it('uses the session another tab refreshed when its own refresh token was rotated away', async () => {
    setSession(session('1'))
    fetchMock
      .mockResolvedValueOnce(reply(401, { code: 'AUTH_TOKEN_EXPIRED' }))
      .mockImplementationOnce(async () => {
        setSession(session('2')) // the other tab won the race and stored the rotated session
        return reply(401, { code: 'AUTH_REFRESH_TOKEN_REVOKED' })
      })
      .mockResolvedValueOnce(reply(200, { ok: true }))

    await expect(apiRequest('/api/songs')).resolves.toEqual({ ok: true })
    expect(authorization(2)).toBe('Bearer access-2')
    expect(assign).not.toHaveBeenCalled()
  })

  it('returns to sign-in without refreshing when the token is invalid', async () => {
    setSession(session('1'))
    fetchMock.mockResolvedValueOnce(reply(401, { code: 'AUTH_TOKEN_INVALID' }))

    await expect(apiRequest('/api/songs')).rejects.toMatchObject({ code: 'AUTH_TOKEN_INVALID' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(getSession()).toBeUndefined()
    expect(assign).toHaveBeenCalledWith('/login')
  })
})
