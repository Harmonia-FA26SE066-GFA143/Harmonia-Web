import type { RouteObject } from 'react-router'
import { paths } from '../paths'
import { pageRoute } from '../pageRoute'

const area = 'Cha xứ'
const programs = 'Chương trình phụng vụ'
const loadPrograms = () => import('@/features/liturgical-programs')

/**
 * Parish Priest / Liturgy Committee routes (Report 1 FE-15–FE-23).
 * Only the matching signed-in role is admitted (RoleGuard).
 */
export const priestRoutes: RouteObject[] = [
  pageRoute(
    paths.priest.dashboard,
    { title: 'Tổng quan', breadcrumb: [area, 'Tổng quan'] },
    async () => (await import('@/features/dashboard')).PriestDashboardPage,
  ),
  pageRoute(
    paths.priest.nominations,
    { title: 'Đề cử Ca trưởng', breadcrumb: [area, 'Đề cử Ca trưởng'] },
    async () => (await import('@/features/director-nominations')).PriestNominationsPage,
  ),
  pageRoute(
    paths.priest.calendar,
    { title: 'Lịch phụng vụ', breadcrumb: [area, 'Lịch phụng vụ'] },
    async () => (await loadPrograms()).ProgramCalendarPage,
  ),
  pageRoute(
    paths.priest.programs,
    { title: 'Danh sách chương trình phụng vụ', breadcrumb: [area, programs] },
    async () => (await loadPrograms()).PriestProgramListPage,
  ),
  pageRoute(
    paths.priest.programCreate,
    { title: 'Tạo chương trình', breadcrumb: [area, programs, 'Tạo chương trình'] },
    async () => (await loadPrograms()).CreateProgramPage,
  ),
  pageRoute(
    paths.priest.programDetail,
    { title: 'Chi tiết chương trình phụng vụ', breadcrumb: [area, programs, 'Chi tiết chương trình'] },
    async () => (await loadPrograms()).PriestProgramDetailPage,
  ),
  pageRoute(
    paths.priest.songListReview,
    { title: 'Duyệt danh sách bài hát', breadcrumb: [area, programs, 'Duyệt danh sách bài hát'] },
    async () => (await import('@/features/song-list-review')).SongListReviewPage,
  ),
  pageRoute(
    paths.priest.reports,
    { title: 'Báo cáo', breadcrumb: [area, 'Báo cáo'] },
    async () => (await import('@/features/reports')).PriestReportsPage,
  ),
  pageRoute(
    paths.priest.notes,
    { title: 'Trao đổi với Ca trưởng', breadcrumb: [area, 'Trao đổi'] },
    async () => (await import('@/features/notes')).PriestNotesPage,
  ),
]
