import { DownOutlined, LogoutOutlined, SwapOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Button, Dropdown, Flex, Typography, type MenuProps } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { SignOutModal } from '@/features/auth'
import { useMyProfile } from '@/features/profile'
import { getSession } from '@/lib/auth/session'
import { roleByApiName, roleLabels } from '@/shared/types/account'
import { colors, spacing, typography } from '@/styles/tokens'
import { surfaces, type Surface } from './navigation'

/**
 * Header user menu with the signed-in user's name and role. The name comes from `GET /api/auth/me`, so it follows
 * edits on the Profile page; while that loads it falls back to the session (login answer), then to the email.
 * The workspace switch is a development aid for reviewing every role surface; it is not rendered in production builds.
 */
export function UserMenu({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate()
  const [confirmingSignOut, setConfirmingSignOut] = useState(false)
  const user = getSession()?.user
  const profile = useMyProfile()
  const name = profile.data?.fullName || user?.fullName || user?.email || 'Người dùng'

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
    { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất' },
  ]

  return (
    <>
      <Dropdown
        trigger={['click']}
        menu={{ items, onClick: ({ key }) => (key === 'logout' ? setConfirmingSignOut(true) : navigate(key)) }}
      >
        <Button type="text" aria-label="Menu người dùng" style={{ height: 'auto', paddingBlock: spacing.xs }}>
          <Flex align="center" gap={spacing.sm}>
            <Avatar size={32} icon={<UserOutlined />} style={{ background: colors.primary }} />
            {/* Small screens keep the avatar only, so the brand still fits beside it. */}
            {!compact && (
              <Flex vertical align="flex-start" style={{ lineHeight: 1.3, minWidth: 0 }}>
                <Typography.Text strong ellipsis style={{ maxWidth: 180 }}>
                  {name}
                </Typography.Text>
                <Typography.Text style={{ fontSize: typography.metadata.fontSize, color: colors.textMuted }}>
                  {user ? roleLabels[roleByApiName[user.roleName]] : 'Chưa xác định vai trò'}
                </Typography.Text>
              </Flex>
            )}
            <DownOutlined style={{ fontSize: 10, color: colors.textMuted }} />
          </Flex>
        </Button>
      </Dropdown>
      <SignOutModal open={confirmingSignOut} onClose={() => setConfirmingSignOut(false)} />
    </>
  )
}
