import { DownOutlined, LogoutOutlined, SwapOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Button, Dropdown, Flex, Typography, type MenuProps } from 'antd'
import { useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { colors, spacing, typography } from '@/styles/tokens'
import { surfaces, type Surface } from './navigation'

/**
 * Header user menu. The signed-in user's name/role and sign-out are TBD until the auth contract exists.
 * The workspace switch is a development aid for reviewing every role surface; it is not rendered in production builds.
 */
export function UserMenu({ surface }: { surface?: Surface }) {
  const navigate = useNavigate()

  const items: MenuProps['items'] = [
    { key: paths.profile, icon: <UserOutlined />, label: 'Hồ sơ cá nhân' },
    ...(import.meta.env.DEV
      ? [
          { type: 'divider' as const },
          {
            type: 'group' as const,
            label: 'Chuyển không gian (chỉ môi trường phát triển)',
            children: (Object.keys(surfaces) as Surface[]).map((key) => ({
              key: surfaces[key].basePath,
              icon: <SwapOutlined />,
              label: surfaces[key].label,
            })),
          },
        ]
      : []),
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      disabled: true,
      title: 'Chưa khả dụng: chờ hợp đồng API xác thực',
    },
  ]

  return (
    <Dropdown
      trigger={['click']}
      menu={{ items, onClick: ({ key }) => key !== 'logout' && navigate(key) }}
    >
      <Button type="text" aria-label="Menu người dùng" style={{ height: 'auto', paddingBlock: spacing.xs }}>
        <Flex align="center" gap={spacing.sm}>
          <Avatar size={32} icon={<UserOutlined />} style={{ background: colors.primary }} />
          <Flex vertical align="flex-start" style={{ lineHeight: 1.3 }}>
            <Typography.Text strong>Người dùng</Typography.Text>
            <Typography.Text style={{ fontSize: typography.metadata.fontSize, color: colors.textMuted }}>
              {surface ? surfaces[surface].label : 'Chưa xác định vai trò'}
            </Typography.Text>
          </Flex>
          <DownOutlined style={{ fontSize: 10, color: colors.textMuted }} />
        </Flex>
      </Button>
    </Dropdown>
  )
}
