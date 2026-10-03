import type { SystemRole } from '@/shared/types/account'

export interface SignInValues {
  email: string
  password: string
}

/** Outcome of a successful sign-in: the role decides which workspace opens. */
export interface SignInResult {
  role: SystemRole
}

/** Failures the sign-in form can display (by backend error code, see LoginPage). */
export type SignInError = { kind: 'invalid-credentials' } | { kind: 'inactive' } | { kind: 'unavailable' }

export interface PasswordResetRequestValues {
  email: string
}
