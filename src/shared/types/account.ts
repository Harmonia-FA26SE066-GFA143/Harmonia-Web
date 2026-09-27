/**
 * Account roles and statuses shared by the auth and profile features.
 * Sources: Report 1 FE-48 (assignable roles) and the DECIDED section of docs/local/business/roles-permissions.md
 * (2026-09-26: requested role at registration, conceptual account statuses).
 * These are UI-level values; persisted values and display names must be agreed with the backend (TBD).
 */
export type SystemRole = 'priest' | 'director' | 'member' | 'admin'

export const roleLabels: Record<SystemRole, string> = {
  priest: 'Cha xứ / Ban phụng vụ',
  director: 'Ca trưởng',
  member: 'Ca viên',
  admin: 'Quản trị viên',
}

/** Roles a registrant may request. Admin is never selectable; the Admin confirms or assigns the final role. */
export type RequestableRole = Exclude<SystemRole, 'admin'>

export const requestableRoles: RequestableRole[] = ['priest', 'director', 'member']

export type AccountStatus = 'pending' | 'active' | 'rejected' | 'deactivated'

export const accountStatusLabels: Record<AccountStatus, string> = {
  pending: 'Chờ xác nhận',
  active: 'Đang hoạt động',
  rejected: 'Bị từ chối',
  deactivated: 'Ngừng hoạt động',
}
