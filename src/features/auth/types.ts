import type { SystemRole } from '@/shared/types/account'

export interface SignInValues {
  email: string
  password: string
}

/** Outcome of a successful sign-in: the role decides which workspace opens. */
export interface SignInResult {
  role: SystemRole
  /** The account still has the first password the backend emailed; it must be changed first. */
  mustChangePassword: boolean
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

/** Fields of the reset and change forms; the confirmation is checked on the web only. */
export interface NewPasswordFormValues {
  /** Asked on the change form only. */
  currentPassword?: string
  newPassword: string
  confirmPassword: string
}

/** Body of POST /api/auth/change-password (ChangePasswordRequestValidator: new password must be strong). */
export interface ChangePasswordValues {
  currentPassword: string
  newPassword: string
}
