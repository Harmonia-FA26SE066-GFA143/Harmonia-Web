import type { SystemRole } from '@/shared/types/account'

/**
 * UI model of the signed-in user's profile. Every account is Admin-created with one role (D1, 2026-10-07).
 * Mapped from `UserDto` of `GET /api/auth/me` (see profileApi). `fullName` may be empty on the backend.
 */
export interface Profile {
  fullName: string
  email: string
  phone?: string
  role: SystemRole
}

/** Fields the user may edit (owner decision 2026-09-27; `PUT /api/auth/me`): both optional. */
export interface ProfileUpdateValues {
  fullName?: string
  phone?: string
}
