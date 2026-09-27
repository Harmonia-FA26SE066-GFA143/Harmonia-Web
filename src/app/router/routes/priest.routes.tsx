import type { RouteObject } from 'react-router'
import { paths } from '../paths'
import { placeholderRoute } from '../placeholderRoute'

const area = 'Cha xứ'
const programs = 'Chương trình phụng vụ'

/**
 * Parish Priest / Liturgy Committee routes (Report 1 FE-15–FE-23).
 * Route protection (ProtectedRoute/RoleGuard) is TBD until the auth API contract and
 * role values are available; see docs/decisions and the workspace open-business-decisions.md.
 */
export const priestRoutes: RouteObject[] = [
  placeholderRoute(paths.priest.dashboard, { title: 'Tổng quan', breadcrumb: [area, 'Tổng quan'], phase: 4 }),
  placeholderRoute(paths.priest.calendar, { title: 'Lịch phụng vụ', breadcrumb: [area, 'Lịch phụng vụ'], phase: 4 }),
  placeholderRoute(paths.priest.programs, {
    title: 'Danh sách chương trình phụng vụ',
    breadcrumb: [area, programs],
    phase: 4,
  }),
  placeholderRoute(paths.priest.programCreate, {
    title: 'Tạo chương trình phụng vụ',
    breadcrumb: [area, programs, 'Tạo chương trình'],
    phase: 4,
  }),
  placeholderRoute(paths.priest.programDetail, {
    title: 'Chi tiết chương trình phụng vụ',
    breadcrumb: [area, programs, 'Chi tiết chương trình'],
    phase: 4,
  }),
  placeholderRoute(paths.priest.songListReview, {
    title: 'Duyệt danh sách bài hát',
    breadcrumb: [area, programs, 'Duyệt danh sách bài hát'],
    phase: 5,
  }),
  placeholderRoute(paths.priest.reports, { title: 'Báo cáo', breadcrumb: [area, 'Báo cáo'], phase: 3 }),
]
