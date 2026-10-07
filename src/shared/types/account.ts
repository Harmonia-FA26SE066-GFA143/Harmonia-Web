import type { ApiRoleName } from '@/lib/auth/session'

/**
 * Account roles shared by the auth, users and profile features (Report 1 FE-48). UI-level values; the backend
 * sends `roleName` (`ApiRoleName`), mapped here and nowhere else.
 */
export type SystemRole = 'priest' | 'director' | 'member' | 'admin'

export const roleLabels: Record<SystemRole, string> = {
  priest: 'Cha xứ / Ban phụng vụ',
  director: 'Ca trưởng',
  member: 'Ca viên',
  admin: 'Quản trị viên',
}

export const roleByApiName: Record<ApiRoleName, SystemRole> = {
  Admin: 'admin',
  ParishPriest: 'priest',
  ChoirDirector: 'director',
  ChoirMember: 'member',
}

export const apiNameByRole = Object.fromEntries(
  Object.entries(roleByApiName).map(([apiName, role]) => [role, apiName]),
) as Record<SystemRole, ApiRoleName>
