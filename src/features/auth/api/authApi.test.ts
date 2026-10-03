import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getSession, setSession, type Session } from '@/lib/auth/session'
import { signIn, signOut } from './authApi'

const session: Session = {
  accessToken: 'access-1',
  accessTokenExpiresAt: '2026-10-03T10:00:00Z',
  refreshToken: 'refresh-1',
  user: { id: 'u1', email: 'an@giaoxu.org', roleName: 'ParishPriest' },
}

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

describe('signIn', () => {
  it('signs in from the web, keeps the session and maps the role', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(session), { status: 200 }))

    await expect(signIn({ email: 'an@giaoxu.org', password: 'Secret123' })).resolves.toEqual({ role: 'priest' })
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/auth\/login$/)
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      email: 'an@giaoxu.org',
      password: 'Secret123',
      platform: 'Web',
    })
    expect(getSession()).toEqual(session)
  })
})

describe('signOut', () => {
  it('revokes the refresh token and forgets the session', async () => {
    setSession(session)
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))

    await signOut()
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/auth\/logout$/)
    expect(fetchMock.mock.calls[0][1]?.body).toBe(JSON.stringify({ refreshToken: 'refresh-1' }))
    expect(getSession()).toBeUndefined()
  })

  it('forgets the session even when the server cannot be reached', async () => {
    setSession(session)
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await expect(signOut()).resolves.toBeUndefined()
    expect(getSession()).toBeUndefined()
  })
})
