import { useSyncExternalStore } from 'react'

/** Role names sent by the backend (Harmonia-BE `RoleNames`). */
export type ApiRoleName = 'Admin' | 'ParishPriest' | 'ChoirDirector' | 'ChoirMember'

/** LoginResponse of POST /api/auth/login and /api/auth/refresh, stored as received. */
export interface Session {
  accessToken: string
  accessTokenExpiresAt: string
  refreshToken: string
  user: {
    id: string
    email: string
    /** May be empty: the Admin can create an account without a name. Absent in sessions stored before it was read. */
    fullName?: string
    roleName: ApiRoleName
    /** True until an Admin-created user replaces the emailed first password (Harmonia-BE `ad0fa37`). */
    isPasswordChangeRequired?: boolean
  }
}

// localStorage keeps the session across reloads (owner decision 2026-10-03). The backend returns the refresh
// token in the body, so an httpOnly cookie is not available.
const storageKey = 'harmonia.session'

export function getSession(): Session | undefined {
  try {
    return parseSession(localStorage.getItem(storageKey))
  } catch {
    return undefined
  }
}

let passwordChangeCompleted = false

export function clearPasswordChangeCompleted() {
  passwordChangeCompleted = false
}

export function isPasswordChangeCompleted(): boolean {
  return passwordChangeCompleted
}

export function setSession(session: Session) {
  passwordChangeCompleted = false
  localStorage.setItem(storageKey, JSON.stringify(session))
  notifySession()
}

const sessionListeners = new Set<() => void>()

function notifySession() {
  for (const listener of sessionListeners) listener()
}

/** Notifies on setSession/clearSession in this tab and on a token refresh in another tab. */
export function subscribeSession(listener: () => void) {
  sessionListeners.add(listener)
  return () => {
    sessionListeners.delete(listener)
  }
}

function parseSession(raw: string | null): Session | undefined {
  try {
    return raw ? (JSON.parse(raw) as Session) : undefined
  } catch {
    return undefined
  }
}

const accountOf = (session: Session | undefined) => session && `${session.user.id}:${session.user.roleName}`

// Another tab signed in, signed out or switched account: reload so the guards, the shell, the query cache and the
// background tasks all start from the new account at once instead of mixing two. A token refresh (same account)
// only re-renders.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== storageKey && event.key !== null) return
    const before = event.key === null ? cachedSession : parseSession(event.oldValue)
    if (accountOf(before) === accountOf(getSession())) notifySession()
    else location.reload()
  })
}

// useSyncExternalStore needs the same object back until the stored string changes, or React re-renders forever.
let cachedRaw: string | null = null
let cachedSession: Session | undefined

function getSessionSnapshot(): Session | undefined {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(storageKey)
  } catch {
    // Storage blocked: no session.
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw
    cachedSession = parseSession(raw)
  }
  return cachedSession
}

/** The current session, re-rendering the caller when it is set or cleared. */
export function useSession(): Session | undefined {
  return useSyncExternalStore(subscribeSession, getSessionSnapshot)
}

/** sessionStorage keys of drafts that belong to the signed-in account (e.g. AI-extracted lyrics). */
export const sessionDraftPrefix = 'harmonia.draft.'

const clearedListeners = new Set<() => void>()

/** Called whenever the session ends (sign-out, password change, a dead token), so account data in memory is dropped. */
export function onSessionCleared(listener: () => void) {
  clearedListeners.add(listener)
  return () => {
    clearedListeners.delete(listener)
  }
}

/**
 * Ends the session and drops what the account left in this tab: its drafts and, via the listeners, its tasks.
 * `passwordChanged` marks the change completed before subscribers re-render, so `AuthGuard` keeps `/change-password`
 * on its confirmation instead of sending it to `/login` like every other ended session.
 */
export function clearSession({ passwordChanged = false }: { passwordChanged?: boolean } = {}) {
  passwordChangeCompleted = passwordChanged
  localStorage.removeItem(storageKey)
  try {
    for (const key of Object.keys(sessionStorage)) if (key.startsWith(sessionDraftPrefix)) sessionStorage.removeItem(key)
  } catch {
    // Storage blocked: nothing was saved there either.
  }
  for (const listener of clearedListeners) listener()
  notifySession()
}
