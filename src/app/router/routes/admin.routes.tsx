import type { RouteObject } from 'react-router'
import { paths } from '../paths'
import { pageRoute } from '../placeholderRoute'

const area = 'Quản trị hệ thống'

/**
 * Admin routes (Report 1 FE-47–FE-54).
 * Only the matching signed-in role is admitted (RoleGuard).
 */
export const adminRoutes: RouteObject[] = [
  pageRoute(
    paths.admin.dashboard,
    { title: 'Tổng quan', breadcrumb: [area, 'Tổng quan'], phase: 3 },
    async () => (await import('@/features/dashboard')).AdminDashboardPage,
  ),
  pageRoute(
    paths.admin.accounts,
    { title: 'Tài khoản', breadcrumb: [area, 'Tài khoản'], phase: 2 },
    async () => (await import('@/features/users')).AccountsPage,
  ),
  pageRoute(
    paths.admin.roles,
    { title: 'Vai trò & Phân quyền', breadcrumb: [area, 'Vai trò & Phân quyền'], phase: 2 },
    async () => (await import('@/features/users')).RolesPage,
  ),
  pageRoute(
    paths.admin.skillCategories,
    { title: 'Danh mục kỹ năng', breadcrumb: [area, 'Danh mục kỹ năng'], phase: 2 },
    async () => (await import('@/features/system-categories')).SkillCategoriesPage,
  ),
  pageRoute(
    paths.admin.liturgicalCategories,
    { title: 'Danh mục phụng vụ', breadcrumb: [area, 'Danh mục phụng vụ'], phase: 2 },
    async () => (await import('@/features/system-categories')).LiturgicalCategoriesPage,
  ),
  pageRoute(
    paths.admin.settings,
    { title: 'Cấu hình chung', breadcrumb: [area, 'Cấu hình chung'], phase: 2 },
    async () => (await import('@/features/settings')).SettingsPage,
  ),
  pageRoute(
    paths.admin.reports,
    { title: 'Báo cáo', breadcrumb: [area, 'Báo cáo'], phase: 3 },
    async () => (await import('@/features/reports')).AdminReportsPage,
  ),
  pageRoute(
    paths.admin.activityLog,
    { title: 'Lịch sử hoạt động', breadcrumb: [area, 'Lịch sử hoạt động'], phase: 3 },
    async () => (await import('@/features/activity-log')).ActivityLogPage,
  ),
]
