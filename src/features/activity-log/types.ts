import type { SystemRole } from '@/shared/types/account'

/**
 * Activity kinds Report 1 FE-54 requires the Admin to see: role changes, skill approvals, song-list approvals,
 * roster confirmation, attendance updates and deleted materials. Other kinds shown by Stitch are not adopted.
 * TBD: Backend API missing – stored values and whether more kinds are logged come with the contract.
 */
export type ActivityType =
  | 'roleChange'
  | 'skillApproval'
  | 'songListApproval'
  | 'rosterConfirmation'
  | 'attendanceUpdate'
  | 'materialDeletion'

export const activityTypeLabels: Record<ActivityType, string> = {
  roleChange: 'Thay đổi vai trò',
  skillApproval: 'Duyệt kỹ năng',
  songListApproval: 'Duyệt danh sách bài hát',
  rosterConfirmation: 'Xác nhận phân công',
  attendanceUpdate: 'Cập nhật điểm danh',
  materialDeletion: 'Xoá tài liệu',
}

/** One recorded activity (read-only). TBD: field names and detail format come with the API contract. */
export interface ActivityRecord {
  id: string
  /** ISO 8601 timestamp. */
  occurredAt: string
  actorName: string
  actorRole?: SystemRole
  type: ActivityType
  /** Human-readable description of what was affected, e.g. the program or account. */
  target: string
  /** Optional free-text details supplied by the backend. */
  details?: string
}

export type ActivityPeriod = 'today' | 'last7Days' | 'last30Days'

export interface ActivityFilters {
  search: string
  type?: ActivityType
  actorName?: string
  period?: ActivityPeriod
}
