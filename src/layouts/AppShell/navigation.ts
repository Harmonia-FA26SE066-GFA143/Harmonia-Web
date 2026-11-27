import { paths } from '@/app/router/paths'
import { usePendingNominationCount, useTrainedNominationCount } from '@/features/director-nominations'
import { useWaitingRegistrationCount } from '@/features/member-registrations'
import { usePendingSkills } from '@/features/skill-approval'
import type { IconName } from '@/shared/ui'
import type { ApiRoleName } from '@/lib/auth/session'

/** A role workspace. Chosen from the URL prefix; it is not an authorization check. */
export type Surface = 'priest' | 'director' | 'admin'

/** Web workspace of each role. Choir Members use the mobile app, so they have none. */
export const surfaceByRole: Partial<Record<ApiRoleName, Surface>> = {
  Admin: 'admin',
  ParishPriest: 'priest',
  ChoirDirector: 'director',
}

export interface NavItem {
  path: string
  label: string
  icon: IconName
  /** How many items wait on this page, when every row of its list is waiting. A hook: called once per tab, every render. */
  useCount?: () => number | undefined
}

export interface NavSection {
  label: string
  items: NavItem[]
}

export interface SurfaceConfig {
  label: string
  basePath: string
  sections: NavSection[]
}

/** The same one-row page the Director dashboard reads, so both share one request. */
const usePendingSkillCount = () => usePendingSkills({ pageNumber: 1, pageSize: 1 }).data?.totalCount

/**
 * Navigation per role, limited to pages in the screen map. Each section is an area of the running head.
 * RoleGuard admits each role to its own workspace only, so each role sees its own navigation.
 */
export const surfaces: Record<Surface, SurfaceConfig> = {
  priest: {
    label: 'Cha xứ',
    basePath: paths.priest.dashboard,
    sections: [
      { label: 'Tổng quan', items: [{ path: paths.priest.dashboard, label: 'Tổng quan', icon: 'overview' }] },
      {
        label: 'Phụng vụ & lịch',
        items: [
          { path: paths.priest.calendar, label: 'Lịch phụng vụ', icon: 'liturgy-season' },
          { path: paths.priest.programs, label: 'Chương trình phụng vụ', icon: 'program' },
        ],
      },
      { label: 'Ca trưởng', items: [{ path: paths.priest.nominations, label: 'Đề cử Ca trưởng', icon: 'nomination', useCount: usePendingNominationCount }] },
      { label: 'Trao đổi', items: [{ path: paths.priest.notes, label: 'Trao đổi với Ca trưởng', icon: 'notes' }] },
      { label: 'Báo cáo', items: [{ path: paths.priest.reports, label: 'Báo cáo', icon: 'report' }] },
    ],
  },
  director: {
    label: 'Ca trưởng',
    basePath: paths.director.dashboard,
    sections: [
      { label: 'Tổng quan', items: [{ path: paths.director.dashboard, label: 'Tổng quan', icon: 'overview' }] },
      {
        label: 'Ca viên',
        items: [
          { path: paths.director.members, label: 'Danh sách ca viên', icon: 'choir-member' },
          { path: paths.director.choirs, label: 'Quản lý ca đoàn', icon: 'choir' },
          { path: paths.director.skillApproval, label: 'Duyệt kỹ năng', icon: 'skill-approval', useCount: usePendingSkillCount },
          { path: paths.director.nominations, label: 'Đề cử Ca trưởng', icon: 'nomination' },
        ],
      },
      {
        label: 'Phụng vụ & âm nhạc',
        items: [
          { path: paths.director.programs, label: 'Chương trình phụng vụ', icon: 'program' },
          { path: paths.director.library, label: 'Kho bài hát', icon: 'song' },
        ],
      },
      {
        label: 'Hoạt động ca đoàn',
        items: [
          { path: paths.director.rehearsals, label: 'Lịch tập', icon: 'rehearsal' },
          { path: paths.director.attendance, label: 'Điểm danh', icon: 'attendance' },
          { path: paths.director.participation, label: 'Xác nhận tham gia', icon: 'participation' },
          { path: paths.director.roster, label: 'Phân công', icon: 'roster' },
          { path: paths.director.practice, label: 'Luyện tập', icon: 'practice' },
        ],
      },
      { label: 'Trao đổi', items: [{ path: paths.director.notes, label: 'Trao đổi với Cha xứ', icon: 'notes' }] },
      { label: 'Báo cáo', items: [{ path: paths.director.reports, label: 'Báo cáo ca đoàn', icon: 'report' }] },
    ],
  },
  admin: {
    label: 'Quản trị hệ thống',
    basePath: paths.admin.dashboard,
    sections: [
      {
        label: 'Tổng quan',
        items: [{ path: paths.admin.dashboard, label: 'Tổng quan', icon: 'overview' }],
      },
      {
        label: 'Người dùng',
        items: [
          { path: paths.admin.accounts, label: 'Tài khoản', icon: 'account' },
          { path: paths.admin.memberRegistrations, label: 'Đăng ký gia nhập', icon: 'member-add', useCount: useWaitingRegistrationCount },
          { path: paths.admin.roles, label: 'Vai trò & Phân quyền', icon: 'roles' },
          { path: paths.admin.nominations, label: 'Đề cử Ca trưởng', icon: 'nomination', useCount: useTrainedNominationCount },
        ],
      },
      {
        label: 'Tổ chức',
        items: [{ path: paths.admin.choirs, label: 'Ca đoàn', icon: 'choir' }],
      },
      {
        label: 'Danh mục',
        items: [
          { path: paths.admin.skillCategories, label: 'Kỹ năng', icon: 'tag' },
          { path: paths.admin.liturgicalCategories, label: 'Phụng vụ', icon: 'liturgy-category' },
        ],
      },
      {
        label: 'Hệ thống',
        items: [
          { path: paths.admin.settings, label: 'Cấu hình chung', icon: 'settings' },
          { path: paths.admin.activityLog, label: 'Lịch sử hoạt động', icon: 'history' },
        ],
      },
      {
        label: 'Báo cáo',
        items: [{ path: paths.admin.reports, label: 'Báo cáo', icon: 'report' }],
      },
    ],
  },
}

/** Shown on role-neutral pages (e.g. Hồ sơ cá nhân) when no signed-in role is known. */
export const workspaceSections: NavSection[] = [
  {
    label: 'Không gian làm việc',
    items: (Object.keys(surfaces) as Surface[]).map((surface) => ({
      path: surfaces[surface].basePath,
      label: surfaces[surface].label,
      icon: 'workspace-switch' as const,
    })),
  },
]

export function getSurface(pathname: string): Surface | undefined {
  return (Object.keys(surfaces) as Surface[]).find(
    (surface) => pathname === surfaces[surface].basePath || pathname.startsWith(`${surfaces[surface].basePath}/`),
  )
}

/** Longest nav path matching the current location, so detail pages highlight their list. */
export function findSelectedPath(sections: NavSection[], pathname: string): string | undefined {
  return sections
    .flatMap((section) => section.items.map((item) => item.path))
    .filter((path) => pathname === path || pathname.startsWith(`${path}/`))
    .sort((a, b) => b.length - a.length)[0]
}
