import type { SystemRole } from '@/shared/types/account'

/** Assignable system roles in Report 1 FE-48 order. Instrumentalist is not a role (UNRESOLVED), so it is absent. */
export const assignableRoles: SystemRole[] = ['priest', 'director', 'member', 'admin']

/** One-line summaries of each role's responsibilities, from docs/local/business/actors.md (Report 1). */
export const roleDescriptions: Record<SystemRole, string> = {
  priest: 'Lập và xem xét chương trình phụng vụ, duyệt danh sách bài hát, theo dõi chuẩn bị và báo cáo.',
  director: 'Quản lý ca viên, duyệt kỹ năng khai báo, lịch tập, kho bài hát, đề xuất bài hát, phân công và luyện tập.',
  member: 'Khai báo kỹ năng, phản hồi sự kiện, xem bài hát đã duyệt, luyện tập và nộp bài.',
  admin: 'Quản lý tài khoản, gán vai trò, cấu hình danh mục, xem báo cáo và lịch sử hoạt động.',
}
