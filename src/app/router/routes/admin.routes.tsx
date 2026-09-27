import type { RouteObject } from 'react-router'
import { paths } from '../paths'
import { pageRoute, placeholderRoute } from '../placeholderRoute'

const area = 'Quản trị hệ thống'

/**
 * Admin routes (Report 1 FE-47–FE-54).
 * Route protection (ProtectedRoute/RoleGuard) is TBD until the auth API contract and
 * role values are available; see docs/decisions and the workspace open-business-decisions.md.
 */
export const adminRoutes: RouteObject[] = [
  placeholderRoute(paths.admin.dashboard, { title: 'Tổng quan', breadcrumb: [area, 'Tổng quan'], phase: 3 }),
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
  placeholderRoute(paths.admin.reports, { title: 'Báo cáo', breadcrumb: [area, 'Báo cáo'], phase: 3 }),
  placeholderRoute(paths.admin.activityLog, {
    title: 'Lịch sử hoạt động',
    breadcrumb: [area, 'Lịch sử hoạt động'],
    phase: 3,
  }),
]
