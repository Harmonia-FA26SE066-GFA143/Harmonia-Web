import {
  AppstoreOutlined,
  AuditOutlined,
  BarChartOutlined,
  BookOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  FileTextOutlined,
  HistoryOutlined,
  IdcardOutlined,
  SafetyCertificateOutlined,
  ScheduleOutlined,
  SettingOutlined,
  SoundOutlined,
  TagsOutlined,
  TeamOutlined,
  UnorderedListOutlined,
  UserSwitchOutlined,
  UsergroupAddOutlined,
} from '@ant-design/icons'
import type { ComponentType } from 'react'
import { paths } from '@/app/router/paths'

/** A role workspace. Chosen from the URL prefix; it is not an authorization check. */
export type Surface = 'priest' | 'director' | 'admin'

export interface NavItem {
  path: string
  label: string
  icon: ComponentType
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

/**
 * Sidebar per role, derived from the Stitch sidebars and limited to pages in the screen map.
 * Filtering by the signed-in user's role is TBD until the auth contract is available.
 */
export const surfaces: Record<Surface, SurfaceConfig> = {
  priest: {
    label: 'Cha xứ / Hội đồng Phụng vụ',
    basePath: paths.priest.dashboard,
    sections: [
      { label: 'Tổng quan', items: [{ path: paths.priest.dashboard, label: 'Tổng quan', icon: AppstoreOutlined }] },
      {
        label: 'Phụng vụ & lịch',
        items: [
          { path: paths.priest.calendar, label: 'Lịch phụng vụ', icon: CalendarOutlined },
          { path: paths.priest.programs, label: 'Danh sách chương trình', icon: UnorderedListOutlined },
        ],
      },
      { label: 'Báo cáo', items: [{ path: paths.priest.reports, label: 'Báo cáo', icon: BarChartOutlined }] },
    ],
  },
  director: {
    label: 'Ca trưởng',
    basePath: paths.director.dashboard,
    sections: [
      { label: 'Tổng quan', items: [{ path: paths.director.dashboard, label: 'Tổng quan', icon: AppstoreOutlined }] },
      {
        label: 'Ca viên',
        items: [
          { path: paths.director.members, label: 'Danh sách ca viên', icon: IdcardOutlined },
          { path: paths.director.skillApproval, label: 'Duyệt kỹ năng', icon: SafetyCertificateOutlined },
        ],
      },
      {
        label: 'Phụng vụ & âm nhạc',
        items: [
          { path: paths.director.programs, label: 'Chương trình phụng vụ', icon: UnorderedListOutlined },
          { path: paths.director.library, label: 'Kho bài hát', icon: BookOutlined },
        ],
      },
      {
        label: 'Hoạt động ca đoàn',
        items: [
          { path: paths.director.rehearsals, label: 'Lịch tập', icon: ScheduleOutlined },
          { path: paths.director.attendance, label: 'Điểm danh', icon: CheckSquareOutlined },
          { path: paths.director.participation, label: 'Xác nhận tham gia', icon: UsergroupAddOutlined },
          { path: paths.director.roster, label: 'Phân công phục vụ', icon: TeamOutlined },
          { path: paths.director.practice, label: 'Luyện tập', icon: SoundOutlined },
        ],
      },
      { label: 'Báo cáo', items: [{ path: paths.director.reports, label: 'Báo cáo ca đoàn', icon: BarChartOutlined }] },
    ],
  },
  admin: {
    label: 'Quản trị hệ thống',
    basePath: paths.admin.dashboard,
    sections: [
      {
        label: 'Quản trị hệ thống',
        items: [
          { path: paths.admin.dashboard, label: 'Tổng quan', icon: AppstoreOutlined },
          { path: paths.admin.accounts, label: 'Tài khoản', icon: TeamOutlined },
          { path: paths.admin.roles, label: 'Vai trò & Phân quyền', icon: UserSwitchOutlined },
          { path: paths.admin.skillCategories, label: 'Danh mục kỹ năng', icon: TagsOutlined },
          { path: paths.admin.liturgicalCategories, label: 'Danh mục phụng vụ', icon: FileTextOutlined },
          { path: paths.admin.settings, label: 'Cấu hình chung', icon: SettingOutlined },
          { path: paths.admin.reports, label: 'Báo cáo', icon: BarChartOutlined },
          { path: paths.admin.activityLog, label: 'Lịch sử hoạt động', icon: HistoryOutlined },
        ],
      },
    ],
  },
}

/**
 * Shown on role-neutral pages (e.g. Hồ sơ cá nhân) until the signed-in role is known.
 * Temporary: replaced by the user's own navigation once auth exists.
 */
export const workspaceSections: NavSection[] = [
  {
    label: 'Không gian làm việc',
    items: (Object.keys(surfaces) as Surface[]).map((surface) => ({
      path: surfaces[surface].basePath,
      label: surfaces[surface].label,
      icon: AuditOutlined,
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
