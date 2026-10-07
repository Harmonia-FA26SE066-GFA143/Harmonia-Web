import type { SystemRole } from '@/shared/types/account'

/**
 * An account as the Admin sees it in User Accounts (FE-47) and role assignment (FE-48): `UserDto` of `/api/users`
 * (Harmonia-BE). Admin-created, one role, active or not (owner decision D1, 2026-10-07: follow the BE).
 */
export interface Account {
  id: string
  fullName: string
  email: string
  role: SystemRole
  isActive: boolean
}

export const accountStatusLabels = { active: 'Đang hoạt động', inactive: 'Ngừng hoạt động' }

/** Body of POST /api/users (CreateUserRequestValidator: fullName ≤ 100, password ≥ 8). */
export interface CreateAccountValues {
  fullName: string
  email: string
  /** Initial password chosen by the Admin. */
  password: string
  role: SystemRole
}

/** Body of PUT /api/users/{id}. */
export interface UpdateAccountValues {
  fullName: string
  email: string
}

/** Query filters of GET /api/users; they combine with AND on the server. */
export interface AccountFilters {
  /** The backend matches the email only. */
  search: string
  role?: SystemRole
  isActive?: boolean
}
