/**
 * One change recorded by Harmonia-BE (`AuditLogDto`, FE-54): the backend logs every create, update and delete of the
 * entity types it audits, and password changes (AuditableEntityInterceptor). This supersedes the six activity kinds
 * of Report 1 FE-54 the page was built with (owner decision 2026-10-07: follow the BE).
 */
export interface ActivityRecord {
  id: string
  /** Backend `DateTime`; read it with `parseUtc`. */
  createdAt: string
  /** Absent when nobody was signed in, e.g. a password reset through the emailed link. */
  user?: { id: string; fullName?: string; email?: string }
  /** `Created`, `Updated`, `Deleted` or `PasswordChanged`; other words are shown as sent. */
  action: string
  /** Entity name, e.g. `User`, `SongListReview`. */
  entityType: string
  entityId?: string
  /** JSON objects of the changed values; absent for a create (old), a delete (new) and a password change (both). */
  oldValue?: string
  newValue?: string
  ipAddress?: string
}

export const actionLabels: Record<string, string> = {
  Created: 'Tạo mới',
  Updated: 'Cập nhật',
  Deleted: 'Xoá',
  PasswordChanged: 'Đổi mật khẩu',
}

/** The entity types AuditableEntityInterceptor logs, in Vietnamese. */
export const entityTypeLabels: Record<string, string> = {
  User: 'Tài khoản',
  Role: 'Vai trò',
  SystemSetting: 'Cấu hình chung',
  SongList: 'Danh sách bài hát',
  SongListReview: 'Duyệt danh sách bài hát',
  ServiceRoster: 'Phân công phục vụ',
  RosterAssignment: 'Dòng phân công',
  MemberSkill: 'Kỹ năng ca viên',
  LiturgicalEvent: 'Sự kiện phụng vụ',
  MusicMaterial: 'Tài liệu bài hát',
  RehearsalAttendance: 'Điểm danh',
  Skill: 'Kỹ năng',
  SkillCategory: 'Nhóm kỹ năng',
  MassType: 'Loại Thánh lễ',
  CeremonyType: 'Loại nghi thức',
  EventCategory: 'Danh mục sự kiện',
  LiturgicalSeason: 'Mùa phụng vụ',
  SongTheme: 'Chủ đề bài hát',
  LiturgicalSlot: 'Phần phụng vụ',
  LiturgicalSlotRequirement: 'Người cần cho phần phụng vụ',
  WorshipLocation: 'Nơi cử hành',
}

export type ActivityPeriod = 'today' | 'last7Days' | 'last30Days'

/** Server-side filters of GET /api/audit-logs; they combine with AND. */
export interface ActivityFilters {
  entityType?: string
  action?: string
  period?: ActivityPeriod
  /** Set by picking a person in the table; the name is kept to show the active filter. */
  user?: { id: string; name: string }
}
