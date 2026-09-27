import type { RequestableRole, SystemRole } from '@/shared/types/account'

export interface SignInValues {
  email: string
  password: string
}

/**
 * UI model of a sign-in outcome (docs/local/business/roles-permissions.md, DECIDED 2026-09-26).
 * TBD: Backend API missing – the mapping from the real auth response is defined when the contract exists.
 */
export type SignInResult =
  | { status: 'active'; role: SystemRole }
  | { status: 'pending' }
  | { status: 'rejected'; reason?: string }

/** Failures the sign-in form can display. */
export type SignInError = { kind: 'invalid-credentials' } | { kind: 'unavailable' }

export interface RegistrationValues {
  fullName: string
  email: string
  phone?: string
  requestedRole: RequestableRole
  password: string
  confirmPassword: string
}

/** Failures the registration form can display. */
export type RegistrationError = { kind: 'email-taken' } | { kind: 'unavailable' }

export interface PasswordResetRequestValues {
  email: string
}
