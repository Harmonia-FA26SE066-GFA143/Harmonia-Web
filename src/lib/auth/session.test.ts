import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getSession, subscribeSession, useSession, type Session } from './session'

const key = 'harmonia.session'
const session = (id: string, roleName: Session['user']['roleName'], accessToken = 'a1'): Session => ({
  accessToken,
  accessTokenExpiresAt: '2099-01-01T00:00:00Z',
  refreshToken: 'r1',
  user: { id, email: `${id}@giaoxu.org`, roleName },
})

/** Another tab wrote `newValue`: storage is updated first, since session.ts reads the current value from it. */
function otherTabWrites(storageKey: string | null, oldValue: Session | null, newValue: Session | null) {
  if (storageKey === key) {
    if (newValue) localStorage.setItem(key, JSON.stringify(newValue))
    else localStorage.removeItem(key)
  }
  window.dispatchEvent(
    new StorageEvent('storage', {
      key: storageKey,
      oldValue: oldValue && JSON.stringify(oldValue),
      newValue: newValue && JSON.stringify(newValue),
    }),
  )
}

describe('session sync across tabs', () => {
  const reload = vi.fn()
  const listener = vi.fn()
  let unsubscribe: () => void

  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('location', { ...window.location, reload })
    unsubscribe = subscribeSession(listener)
  })

  afterEach(() => {
    unsubscribe()
    vi.unstubAllGlobals()
    reload.mockReset()
    listener.mockReset()
    localStorage.clear()
  })

  it('reloads when another tab switches to a different user', () => {
    localStorage.setItem(key, JSON.stringify(session('u1', 'ChoirDirector')))
    otherTabWrites(key, session('u1', 'ChoirDirector'), session('u2', 'ChoirDirector'))
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('reloads when the same user comes back with another role', () => {
    otherTabWrites(key, session('u1', 'ChoirDirector'), session('u1', 'Admin'))
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('only notifies subscribers on a token refresh of the same account', () => {
    otherTabWrites(key, session('u1', 'ChoirDirector', 'a1'), session('u1', 'ChoirDirector', 'a2'))
    expect(reload).not.toHaveBeenCalled()
    expect(listener).toHaveBeenCalledTimes(1)
    expect(getSession()?.accessToken).toBe('a2')
  })

  it('reloads on sign-in in another tab', () => {
    otherTabWrites(key, null, session('u1', 'ChoirDirector'))
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('reloads on sign-out in another tab', () => {
    otherTabWrites(key, session('u1', 'ChoirDirector'), null)
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('ignores other storage keys', () => {
    localStorage.setItem(key, JSON.stringify(session('u1', 'ChoirDirector')))
    otherTabWrites('harmonia.other', null, null)
    expect(reload).not.toHaveBeenCalled()
    expect(listener).not.toHaveBeenCalled()
  })

  it('reloads when another tab clears all storage (key null) while signed in', () => {
    // With key null there is no oldValue: the account compared is the one this tab rendered (useSession snapshot).
    localStorage.setItem(key, JSON.stringify(session('u1', 'ChoirDirector')))
    const { unmount } = renderHook(() => useSession())
    localStorage.clear()
    otherTabWrites(null, null, null)
    expect(reload).toHaveBeenCalledTimes(1)
    unmount()
  })
})
