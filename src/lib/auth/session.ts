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
    const stored = localStorage.getItem(storageKey)
    return stored ? (JSON.parse(stored) as Session) : undefined
  } catch {
    return undefined
  }
}

export function setSession(session: Session) {
  localStorage.setItem(storageKey, JSON.stringify(session))
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

/** Ends the session and drops what the account left in this tab: its drafts and, via the listeners, its tasks. */
export function clearSession() {
  localStorage.removeItem(storageKey)
  try {
    for (const key of Object.keys(sessionStorage)) if (key.startsWith(sessionDraftPrefix)) sessionStorage.removeItem(key)
  } catch {
    // Storage blocked: nothing was saved there either.
  }
  for (const listener of clearedListeners) listener()
}
