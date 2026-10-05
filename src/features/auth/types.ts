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

/** Body of POST /api/auth/reset-password; `token` comes from the `?token=` of the emailed link. */
export interface PasswordResetValues {
  token: string
  newPassword: string
}

/** Fields of the reset form; the confirmation is checked on the web only. */
export interface NewPasswordFormValues {
  newPassword: string
  confirmPassword: string
}
