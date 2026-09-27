import type { AccountStatus, RequestableRole, SystemRole } from '@/shared/types/account'

/**
 * UI model of the signed-in user's profile. Fields follow the registration decision
 * (docs/local/business/roles-permissions.md, DECIDED 2026-09-26).
 * TBD: Backend API missing – field names and mapping are defined when the contract exists.
 */
export interface Profile {
  fullName: string
  email: string
  phone?: string
  accountStatus: AccountStatus
  /** Confirmed role; absent while the account awaits Admin confirmation. */
  role?: SystemRole
  requestedRole?: RequestableRole
}

/** Fields the user may edit (owner decision 2026-09-27: full name and phone only). */
export interface ProfileUpdateValues {
  fullName: string
  phone?: string
}
