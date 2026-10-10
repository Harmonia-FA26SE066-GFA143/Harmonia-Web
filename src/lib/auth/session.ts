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

export function clearSession() {
  localStorage.removeItem(storageKey)
}
