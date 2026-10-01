import type { RouteObject } from 'react-router'
import { paths } from '../paths'
import { pageRoute, placeholderRoute } from '../placeholderRoute'

const area = 'Ca trưởng'
const programs = 'Chương trình phụng vụ'

/**
 * Choir Director routes (Report 1 FE-24–FE-46).
 * Route protection (ProtectedRoute/RoleGuard) is TBD until the auth API contract and
 * role values are available; see docs/decisions and the workspace open-business-decisions.md.
 */
export const directorRoutes: RouteObject[] = [
  placeholderRoute(paths.director.dashboard, { title: 'Tổng quan', breadcrumb: [area, 'Tổng quan'], phase: 6 }),
  // Director variants of the program list/detail feed the song-list loop, so they are built in phase 5.
  pageRoute(
    paths.director.programs,
    { title: 'Danh sách chương trình phụng vụ', breadcrumb: [area, programs], phase: 5 },
    async () => (await import('@/features/liturgical-programs')).DirectorProgramListPage,
  ),
  pageRoute(
    paths.director.programDetail,
    { title: 'Chi tiết chương trình phụng vụ', breadcrumb: [area, programs, 'Chi tiết chương trình'], phase: 5 },
    async () => (await import('@/features/liturgical-programs')).DirectorProgramDetailPage,
  ),
  pageRoute(
    paths.director.songListProposal,
    { title: 'Đề xuất danh sách bài hát', breadcrumb: [area, programs, 'Đề xuất danh sách bài hát'], phase: 5 },
    async () => (await import('@/features/song-lists')).SongListProposalPage,
  ),
  pageRoute(
    paths.director.library,
    { title: 'Kho bài hát', breadcrumb: [area, 'Kho bài hát'], phase: 5 },
    async () => (await import('@/features/music-library')).MusicLibraryPage,
  ),
  pageRoute(
    paths.director.songDetail,
    { title: 'Chi tiết bài hát', breadcrumb: [area, 'Kho bài hát', 'Chi tiết bài hát'], phase: 5 },
    async () => (await import('@/features/music-library')).SongDetailPage,
  ),
  pageRoute(
    paths.director.rehearsals,
    { title: 'Lịch tập', breadcrumb: [area, 'Lịch tập'], phase: 6 },
    async () => (await import('@/features/rehearsals')).RehearsalsPage,
  ),
  pageRoute(
    paths.director.attendance,
    { title: 'Điểm danh', breadcrumb: [area, 'Điểm danh'], phase: 6 },
    async () => (await import('@/features/attendance')).AttendancePage,
  ),
  pageRoute(
    paths.director.participation,
    { title: 'Xác nhận tham gia', breadcrumb: [area, 'Xác nhận tham gia'], phase: 6 },
    async () => (await import('@/features/participation')).ParticipationPage,
  ),
  pageRoute(
    paths.director.roster,
    { title: 'Yêu cầu nhân sự & Phân công', breadcrumb: [area, 'Phân công phục vụ'], phase: 6 },
    async () => (await import('@/features/roster')).RosterPage,
  ),
  placeholderRoute(paths.director.practice, {
    title: 'Bài tập & Tiến độ luyện tập',
    breadcrumb: [area, 'Luyện tập'],
    phase: 6,
  }),
  placeholderRoute(paths.director.reports, { title: 'Báo cáo ca đoàn', breadcrumb: [area, 'Báo cáo'], phase: 6 }),
]
