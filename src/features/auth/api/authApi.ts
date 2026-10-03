import { apiRequest } from '@/lib/api/client'
import { ApiContractMissingError } from '@/lib/api/errors'
import { clearSession, getSession, setSession, type ApiRoleName, type Session } from '@/lib/auth/session'
import type { SystemRole } from '@/shared/types/account'
import type { PasswordResetRequestValues, SignInResult, SignInValues } from '../types'

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
  return { role: roleByApiName[session.user.roleName] }
}

// TBD: issue #21 covers sign-in only; POST /api/auth/forgot-password is wired in a separate issue.
export async function requestPasswordReset(_values: PasswordResetRequestValues): Promise<void> {
  throw new ApiContractMissingError('Yêu cầu đặt lại mật khẩu')
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
