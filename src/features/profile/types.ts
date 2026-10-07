import type { SystemRole } from '@/shared/types/account'

/**
 * UI model of the signed-in user's profile. Every account is Admin-created with one role (D1, 2026-10-07).
 * TBD: Backend API missing – no current-user profile for the web roles yet (see profileApi); mapping follows it.
 */
export interface Profile {
  fullName: string
  email: string
  phone?: string
  role: SystemRole
}

/** Fields the user may edit (owner decision 2026-09-27: full name and phone only). */
export interface ProfileUpdateValues {
  fullName: string
  phone?: string
}
