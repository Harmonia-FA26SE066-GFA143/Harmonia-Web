import { apiRequest } from '@/lib/api/client'
import { clearSession, getSession, setSession, type ApiRoleName, type Session } from '@/lib/auth/session'
import type { SystemRole } from '@/shared/types/account'
import type { PasswordResetRequestValues, PasswordResetValues, SignInResult, SignInValues } from '../types'

const roleByApiName: Record<ApiRoleName, SystemRole> = {
  Admin: 'admin',
  ParishPriest: 'priest',
  ChoirDirector: 'director',
  ChoirMember: 'member',
}

export async function signIn(values: SignInValues): Promise<SignInResult> {
  const session = await apiRequest<Session>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ ...values, platform: 'Web' }),
  })
  setSession(session)
  // Choir Members use the mobile app and have no web workspace (RoleGuard): revoke the session they just got
  // instead of leaving a valid refresh token behind. signOut needs it stored to authorize the logout call.
  if (session.user.roleName === 'ChoirMember') await signOut()
  return { role: roleByApiName[session.user.roleName] }
}

/** Always 204, whether or not the email has an account, so the screen cannot reveal which emails exist. */
export async function requestPasswordReset(values: PasswordResetRequestValues): Promise<void> {
  await apiRequest<void>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ ...values, platform: 'Web' }),
  })
}

/** Sets a new password with the token from the emailed link. The backend then signs out every device. */
export async function resetPassword(values: PasswordResetValues): Promise<void> {
  await apiRequest<void>('/api/auth/reset-password', { method: 'POST', body: JSON.stringify(values) })
  clearSession()
}

/**
 * Revokes the refresh token on the server, then forgets the session on this device. The local session is
 * cleared even when the server call fails, so the user is never stuck signed in.
 */
export async function signOut(): Promise<void> {
  try {
    if (getSession()?.refreshToken) {
      // Built per attempt: logout requires a valid access token, so an expired one is refreshed first and the
      // retry must revoke the rotated refresh token, not the one the refresh already revoked.
      await apiRequest<void>('/api/auth/logout', () => ({
        method: 'POST',
        body: JSON.stringify({ refreshToken: getSession()?.refreshToken }),
      }))
    }
  } catch {
    // ponytail: a failed revoke leaves the refresh token valid on the server until it expires; retrying
    // or calling /api/auth/logout-all would close that gap if it matters.
  } finally {
    clearSession()
  }
}
