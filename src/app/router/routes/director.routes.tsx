import type { RouteObject } from 'react-router'
import { paths } from '../paths'
import { pageRoute } from '../pageRoute'

const area = 'Ca trưởng'
const programs = 'Chương trình phụng vụ'

/**
 * Choir Director routes (Report 1 FE-24–FE-46).
 * Only the matching signed-in role is admitted (RoleGuard).
 */
export const directorRoutes: RouteObject[] = [
  pageRoute(
    paths.director.dashboard,
    { title: 'Tổng quan', breadcrumb: [area, 'Tổng quan'] },
    async () => (await import('@/features/dashboard')).DirectorDashboardPage,
  ),
  pageRoute(
    paths.director.members,
    { title: 'Danh sách ca viên', breadcrumb: [area, 'Danh sách ca viên'] },
    async () => (await import('@/features/members')).MembersPage,
  ),
  pageRoute(
    paths.director.choirs,
    { title: 'Ca đoàn của tôi', breadcrumb: [area, 'Ca đoàn'] },
    async () => (await import('@/features/choirs')).DirectorChoirsPage,
  ),
  pageRoute(
    paths.director.skillApproval,
    { title: 'Duyệt kỹ năng', breadcrumb: [area, 'Duyệt kỹ năng'] },
    async () => (await import('@/features/skill-approval')).SkillApprovalPage,
  ),
  // Director variants of the program list/detail feed the song-list loop, so they are built in phase 5.
  pageRoute(
    paths.director.programs,
    { title: 'Danh sách chương trình phụng vụ', breadcrumb: [area, programs] },
    async () => (await import('@/features/liturgical-programs')).DirectorProgramListPage,
  ),
  pageRoute(
    paths.director.programDetail,
    { title: 'Chi tiết chương trình phụng vụ', breadcrumb: [area, programs, 'Chi tiết chương trình'] },
    async () => (await import('@/features/liturgical-programs')).DirectorProgramDetailPage,
  ),
  pageRoute(
    paths.director.songListProposal,
    { title: 'Đề xuất danh sách bài hát', breadcrumb: [area, programs, 'Đề xuất danh sách bài hát'] },
    async () => (await import('@/features/song-lists')).SongListProposalPage,
  ),
  pageRoute(
    paths.director.library,
    { title: 'Kho bài hát', breadcrumb: [area, 'Kho bài hát'] },
    async () => (await import('@/features/music-library')).MusicLibraryPage,
  ),
  pageRoute(
    paths.director.songDetail,
    { title: 'Chi tiết bài hát', breadcrumb: [area, 'Kho bài hát', 'Chi tiết bài hát'] },
    async () => (await import('@/features/music-library')).SongDetailPage,
  ),
  pageRoute(
    paths.director.rehearsals,
    { title: 'Lịch tập', breadcrumb: [area, 'Lịch tập'] },
    async () => (await import('@/features/rehearsals')).RehearsalsPage,
  ),
  pageRoute(
    paths.director.rehearsalDetail,
    { title: 'Chi tiết buổi tập', breadcrumb: [area, 'Lịch tập', 'Chi tiết buổi tập'] },
    async () => (await import('@/features/rehearsals')).RehearsalPracticeRoomPage,
  ),
  pageRoute(
    paths.director.attendance,
    { title: 'Điểm danh', breadcrumb: [area, 'Điểm danh'] },
    async () => (await import('@/features/attendance')).AttendancePage,
  ),
  pageRoute(
    paths.director.nominations,
    { title: 'Đề cử Ca trưởng', breadcrumb: [area, 'Đề cử Ca trưởng'] },
    async () => (await import('@/features/director-nominations')).DirectorNominationsPage,
  ),
  pageRoute(
    paths.director.participation,
    { title: 'Xác nhận tham gia', breadcrumb: [area, 'Xác nhận tham gia'] },
    async () => (await import('@/features/participation')).ParticipationPage,
  ),
  pageRoute(
    paths.director.roster,
    { title: 'Phân công', breadcrumb: [area, 'Phân công'] },
    async () => (await import('@/features/roster')).RosterPage,
  ),
  pageRoute(
    paths.director.practice,
    { title: 'Bài tập & Tiến độ luyện tập', breadcrumb: [area, 'Luyện tập'] },
    async () => (await import('@/features/practice')).PracticePage,
  ),
  pageRoute(
    paths.director.notes,
    { title: 'Trao đổi với Cha xứ', breadcrumb: [area, 'Trao đổi'] },
    async () => (await import('@/features/notes')).DirectorNotesPage,
  ),
  pageRoute(
    paths.director.reports,
    { title: 'Báo cáo ca đoàn', breadcrumb: [area, 'Báo cáo'] },
    async () => (await import('@/features/reports')).DirectorReportsPage,
  ),
]
