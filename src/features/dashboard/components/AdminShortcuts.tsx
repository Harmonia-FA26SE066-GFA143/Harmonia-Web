import {
  BarChartOutlined,
  FileTextOutlined,
  HistoryOutlined,
  SettingOutlined,
  TagsOutlined,
  TeamOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons'
import { Card, Col, Flex, Row, Typography } from 'antd'
import type { ComponentType } from 'react'
import { Link } from 'react-router'
import { paths } from '@/app/router/paths'
import { colors, spacing } from '@/styles/tokens'

interface Shortcut {
  path: string
  title: string
  description: string
  icon: ComponentType
}

/** Admin areas with their responsibilities as stated in Report 1 FE-47–FE-54 (docs/local/business/actors.md). */
const shortcuts: Shortcut[] = [
  { path: paths.admin.accounts, title: 'Tài khoản', description: 'Quản lý tài khoản người dùng và xác nhận tài khoản tự đăng ký.', icon: TeamOutlined },
  { path: paths.admin.roles, title: 'Vai trò & Phân quyền', description: 'Gán vai trò hệ thống cho tài khoản.', icon: UserSwitchOutlined },
  { path: paths.admin.skillCategories, title: 'Danh mục kỹ năng', description: 'Cấu hình các kỹ năng thanh nhạc và nhạc cụ.', icon: TagsOutlined },
  { path: paths.admin.liturgicalCategories, title: 'Danh mục phụng vụ', description: 'Mùa phụng vụ, loại Thánh lễ, loại nghi thức và danh mục sự kiện.', icon: FileTextOutlined },
  { path: paths.admin.settings, title: 'Cấu hình chung', description: 'Các thiết lập chung của hệ thống.', icon: SettingOutlined },
  { path: paths.admin.reports, title: 'Báo cáo', description: 'Hoạt động, điểm danh, xác nhận tham gia, hoàn thành bài tập; xuất báo cáo.', icon: BarChartOutlined },
  { path: paths.admin.activityLog, title: 'Lịch sử hoạt động', description: 'Thay đổi vai trò, các lượt duyệt, phân công, điểm danh và xoá tài liệu.', icon: HistoryOutlined },
]

export function AdminShortcuts() {
  return (
    <Row gutter={[spacing.md, spacing.md]}>
      {shortcuts.map(({ path, title, description, icon: Icon }) => (
        <Col key={path} xs={24} sm={12} xl={6}>
          <Link to={path} style={{ display: 'block', height: '100%' }}>
            <Card hoverable style={{ height: '100%' }} styles={{ body: { padding: spacing.md } }}>
              <Flex align="center" gap={spacing.sm} style={{ marginBottom: spacing.xs }}>
                <span aria-hidden style={{ color: colors.primary, fontSize: 18 }}>
                  <Icon />
                </span>
                <Typography.Text strong>{title}</Typography.Text>
              </Flex>
              <Typography.Text style={{ color: colors.textMuted }}>{description}</Typography.Text>
            </Card>
          </Link>
        </Col>
      ))}
    </Row>
  )
}
