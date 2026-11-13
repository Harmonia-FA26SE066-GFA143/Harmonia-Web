import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearSession, getSession, onSessionCleared, sessionDraftPrefix, setSession, type Session } from './session'

const session: Session = {
  accessToken: 'a',
  accessTokenExpiresAt: '2026-11-12T10:00:00Z',
  refreshToken: 'r',
  user: { id: 'u1', email: 'cha@giaoxu.vn', roleName: 'ParishPriest' },
}

afterEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

describe('session storage', () => {
  it('stores and reads the session', () => {
    expect(getSession()).toBeUndefined()
    setSession(session)
    expect(getSession()).toEqual(session)
  })

  it('treats a corrupt stored value as signed out', () => {
    localStorage.setItem('harmonia.session', '{not json')
    expect(getSession()).toBeUndefined()
  })
})

describe('clearSession', () => {
  it('drops the session and this account’s drafts only, then tells the listeners', () => {
    setSession(session)
    sessionStorage.setItem(`${sessionDraftPrefix}lyrics.s1.m1`, 'draft')
    sessionStorage.setItem('other.key', 'keep')
    const listener = vi.fn()
    const stop = onSessionCleared(listener)

    clearSession()

    expect(getSession()).toBeUndefined()
    expect(sessionStorage.getItem(`${sessionDraftPrefix}lyrics.s1.m1`)).toBeNull()
    expect(sessionStorage.getItem('other.key')).toBe('keep')
    expect(listener).toHaveBeenCalledOnce()

    stop()
    clearSession()
    expect(listener).toHaveBeenCalledOnce()
  })
})
