import type { RouteObject } from 'react-router'
import { paths } from '../paths'
import { pageRoute } from '../pageRoute'

const area = 'Quản trị hệ thống'

/**
 * Admin routes (Report 1 FE-47–FE-54).
 * Only the matching signed-in role is admitted (RoleGuard).
 */
export const adminRoutes: RouteObject[] = [
  pageRoute(
    paths.admin.dashboard,
    { title: 'Tổng quan', breadcrumb: [area, 'Tổng quan'] },
    async () => (await import('@/features/dashboard')).AdminDashboardPage,
  ),
  pageRoute(
    paths.admin.accounts,
    { title: 'Tài khoản', breadcrumb: [area, 'Tài khoản'] },
    async () => (await import('@/features/users')).AccountsPage,
  ),
  pageRoute(
    paths.admin.memberRegistrations,
    { title: 'Đăng ký gia nhập', breadcrumb: [area, 'Đăng ký gia nhập'] },
    async () => (await import('@/features/member-registrations')).MemberRegistrationsPage,
  ),
  pageRoute(
    paths.admin.nominations,
    { title: 'Đề cử Ca trưởng', breadcrumb: [area, 'Đề cử Ca trưởng'] },
    async () => (await import('@/features/director-nominations')).AdminNominationsPage,
  ),
  pageRoute(
    paths.admin.roles,
    { title: 'Vai trò & Phân quyền', breadcrumb: [area, 'Vai trò & Phân quyền'] },
    async () => (await import('@/features/users')).RolesPage,
  ),
  pageRoute(
    paths.admin.skillCategories,
    { title: 'Danh mục kỹ năng', breadcrumb: [area, 'Danh mục kỹ năng'] },
    async () => (await import('@/features/system-categories')).SkillCategoriesPage,
  ),
  pageRoute(
    paths.admin.liturgicalCategories,
    { title: 'Danh mục phụng vụ', breadcrumb: [area, 'Danh mục phụng vụ'] },
    async () => (await import('@/features/system-categories')).LiturgicalCategoriesPage,
  ),
  pageRoute(
    paths.admin.choirs,
    { title: 'Ca đoàn', breadcrumb: [area, 'Ca đoàn'] },
    async () => (await import('@/features/choirs')).AdminChoirsPage,
  ),
  pageRoute(
    paths.admin.settings,
    { title: 'Cấu hình chung', breadcrumb: [area, 'Cấu hình chung'] },
    async () => (await import('@/features/settings')).SettingsPage,
  ),
  pageRoute(
    paths.admin.reports,
    { title: 'Báo cáo', breadcrumb: [area, 'Báo cáo'] },
    async () => (await import('@/features/reports')).AdminReportsPage,
  ),
  pageRoute(
    paths.admin.activityLog,
    { title: 'Lịch sử hoạt động', breadcrumb: [area, 'Lịch sử hoạt động'] },
    async () => (await import('@/features/activity-log')).ActivityLogPage,
  ),
]
