import type { SystemRole } from '@/shared/types/account'

/**
 * An account as the Admin sees it in User Accounts (FE-47) and role assignment (FE-48): `UserDto` of `/api/users`
 * (Harmonia-BE). Admin-created, one role, active or not (owner decision D1, 2026-10-07: follow the BE).
 */
export interface Account {
  id: string
  /** Optional on the backend: empty until someone fills it in. */
  fullName: string
  email: string
  phone: string | null
  role: SystemRole
  isActive: boolean
  /** True until the user replaces the first password the backend emailed. */
  isPasswordChangeRequired: boolean
}

export const accountStatusLabels = { active: 'Đang hoạt động', inactive: 'Ngừng hoạt động' }

/** How an account is named in messages: its full name, or its email while the name is empty. */
export const accountName = (account: Pick<Account, 'fullName' | 'email'>) => account.fullName || account.email

/**
 * Body of POST /api/users (CreateUserRequestValidator: fullName ≤ 100, phone ≤ 20). The backend generates the first
 * password and emails it to the user.
 */
export interface CreateAccountValues {
  fullName?: string
  email: string
  phone?: string
  role: SystemRole
}

/** Body of PUT /api/users/{id}: every field is replaced, so an empty name or phone clears it. */
export interface UpdateAccountValues {
  fullName?: string
  email: string
  phone?: string
}

/** Query filters of GET /api/users; they combine with AND on the server. */
export interface AccountFilters {
  /** The backend matches the email only. */
  search: string
  role?: SystemRole
  isActive?: boolean
}
