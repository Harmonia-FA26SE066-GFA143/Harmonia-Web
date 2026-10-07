import { CheckCircleOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { Link, Navigate, useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { ApiError } from '@/lib/api/errors'
import { getSession } from '@/lib/auth/session'
import { AuthCard } from '../components/AuthCard'
import { passwordRuleMessage, ResetPasswordForm } from '../components/ResetPasswordForm'
import { useChangePassword, useSignOut } from '../hooks/useAuthMutations'

/**
 * POST /api/auth/change-password for a signed-in user (Harmonia-BE AuthController). An Admin-created account lands
 * here after signing in until it replaces the emailed first password: the backend answers every other request with
 * 403 AUTH_PASSWORD_CHANGE_REQUIRED meanwhile. Other users reach it from their profile.
 */
export function ChangePasswordPage() {
  const navigate = useNavigate()
  const change = useChangePassword()
  const signOut = useSignOut()
  const error = change.error instanceof ApiError ? change.error : undefined
  // A weak password fails validation: 400 VALIDATION_FAILED with the code under `errors.newPassword`.
  const passwordRejected = Boolean(error?.errors?.newPassword)
  const currentRejected = error?.code === 'AUTH_CURRENT_PASSWORD_INVALID'

  // The backend revoked every session, so the stored one is gone too.
  if (change.isSuccess) {
    return (
      <AuthCard
        icon={<CheckCircleOutlined />}
        title="Đã đổi mật khẩu"
        description="Hãy đăng nhập bằng mật khẩu mới. Các phiên đăng nhập trước đó trên mọi thiết bị đã kết thúc."
      >
        <Button type="primary" block onClick={() => navigate(paths.login)}>
          Đăng nhập
        </Button>
      </AuthCard>
    )
  }

  const session = getSession()
  if (!session) return <Navigate to={paths.login} replace />
  const forced = Boolean(session.user.isPasswordChangeRequired)

  return (
    <AuthCard
      title="Đổi mật khẩu"
      description={
        forced
          ? 'Tài khoản của bạn đang dùng mật khẩu được gửi qua email. Hãy đặt mật khẩu mới trước khi tiếp tục.'
          : 'Sau khi đổi, bạn sẽ cần đăng nhập lại trên mọi thiết bị.'
      }
      footer={
        forced ? (
          <Button
            type="link"
            loading={signOut.isPending}
            onClick={() => signOut.mutate(undefined, { onSettled: () => navigate(paths.login) })}
          >
            Đăng xuất
          </Button>
        ) : (
          <Link to={paths.profile}>Quay lại hồ sơ cá nhân</Link>
        )
      }
    >
      <ResetPasswordForm
        askCurrentPassword
        submitText="Đổi mật khẩu"
        onSubmit={({ currentPassword = '', newPassword }) => change.mutate({ currentPassword, newPassword })}
        submitting={change.isPending}
        failed={change.isError && !passwordRejected && !currentRejected}
        passwordError={passwordRejected ? passwordRuleMessage : undefined}
        currentPasswordError={currentRejected ? 'Mật khẩu hiện tại không đúng.' : undefined}
      />
    </AuthCard>
  )
}
