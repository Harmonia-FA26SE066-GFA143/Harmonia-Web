import {
  BarChartOutlined,
  FileTextOutlined,
  HistoryOutlined,
  SettingOutlined,
  TagsOutlined,
  TeamOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons'
import { paths } from '@/app/router/paths'
import { ShortcutCards, type Shortcut } from './ShortcutCards'

/** Admin areas with their responsibilities as stated in Report 1 FE-47–FE-54 (docs/business/actors.md). */
const shortcuts: Shortcut[] = [
  { path: paths.admin.accounts, title: 'Tài khoản', description: 'Tạo và quản lý tài khoản người dùng.', icon: TeamOutlined },
  { path: paths.admin.roles, title: 'Vai trò & Phân quyền', description: 'Gán vai trò hệ thống cho tài khoản.', icon: UserSwitchOutlined },
  { path: paths.admin.skillCategories, title: 'Danh mục kỹ năng', description: 'Cấu hình các kỹ năng thanh nhạc và nhạc cụ.', icon: TagsOutlined },
  { path: paths.admin.liturgicalCategories, title: 'Danh mục phụng vụ', description: 'Mùa phụng vụ, loại Thánh lễ, loại nghi thức và danh mục sự kiện.', icon: FileTextOutlined },
  { path: paths.admin.settings, title: 'Cấu hình chung', description: 'Các thiết lập chung của hệ thống.', icon: SettingOutlined },
  { path: paths.admin.reports, title: 'Báo cáo', description: 'Hoạt động, điểm danh, xác nhận tham gia, hoàn thành bài tập; xuất báo cáo.', icon: BarChartOutlined },
  { path: paths.admin.activityLog, title: 'Lịch sử hoạt động', description: 'Thay đổi vai trò, các lượt duyệt, phân công, điểm danh và xoá tài liệu.', icon: HistoryOutlined },
]

export function AdminShortcuts() {
  return <ShortcutCards shortcuts={shortcuts} />
}
