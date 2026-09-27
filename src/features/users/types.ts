import type { AccountStatus, RequestableRole, SystemRole } from '@/shared/types/account'

/**
 * An account as the Admin sees it in User Accounts (FE-47) and role assignment (FE-48).
 * Fields follow the registration decision (docs/local/business/roles-permissions.md, DECIDED 2026-09-26).
 * TBD: Backend API missing – identifiers, field names and stored status values come with the contract.
 * Stitch fields not adopted: account code, affiliated choir/unit, notes, initial password mode.
 */
export interface Account {
  id: string
  fullName: string
  email: string
  phone?: string
  status: AccountStatus
  /**
   * Confirmed role; absent while pending confirmation or after rejection.
   * One role per account is an assumption: multiple roles per account is UNRESOLVED (roles-permissions.md).
   */
  role?: SystemRole
  /** Role chosen at self-registration; informational only. */
  requestedRole?: RequestableRole
  /** Optional reason given when the Admin rejected the account. */
  rejectionReason?: string
}

/**
 * Admin-created account (owner decision 2026-09-27: Admin creates accounts directly, any FE-48 role incl. Admin).
 * How the new user gets a password (invitation, temporary password) and the initial status are TBD,
 * so no password field is collected.
 */
export interface CreateAccountValues {
  fullName: string
  email: string
  phone?: string
  role: SystemRole
}

export interface AccountFilters {
  search: string
  role?: SystemRole
  status?: AccountStatus
}
