import { ClockCircleOutlined } from '@ant-design/icons'
import { App, Button, Flex } from 'antd'
import { useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { spacing } from '@/styles/tokens'
import { AuthCard } from '../components/AuthCard'
import { useSignOut } from '../hooks/useAuthMutations'

/**
 * Shown to a signed-in account whose role is not yet confirmed (DECIDED 2026-09-26): only this screen,
 * the own profile and sign-out are available. No Stitch screen exists; built from the auth card pattern.
 */
export function PendingConfirmationPage() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const signOut = useSignOut()

  const handleSignOut = () =>
    signOut.mutate(undefined, {
      onSuccess: () => navigate(paths.login),
      onError: () => message.error('Chưa thể đăng xuất: hệ thống chưa kết nối được máy chủ.'),
    })

  return (
    <AuthCard
      icon={<ClockCircleOutlined />}
      title="Tài khoản đang chờ xác nhận"
      description="Quản trị viên sẽ xác nhận vai trò cho tài khoản của bạn. Sau khi được xác nhận, bạn có thể sử dụng các chức năng theo vai trò."
    >
      <Flex vertical gap={spacing.sm}>
        <Button type="primary" block onClick={() => navigate(paths.profile)}>
          Xem hồ sơ cá nhân
        </Button>
        <Button block loading={signOut.isPending} onClick={handleSignOut}>
          Đăng xuất
        </Button>
      </Flex>
    </AuthCard>
  )
}
