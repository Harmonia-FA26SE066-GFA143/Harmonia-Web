import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { ApiError } from '@/lib/api/errors'
import { AuthCard } from '../components/AuthCard'
import { passwordRuleMessage, ResetPasswordForm } from '../components/ResetPasswordForm'
import { useResetPassword } from '../hooks/useAuthMutations'

/** Error codes of POST /api/auth/reset-password (Harmonia-BE AuthService.ResetPasswordAsync). */
const unusableLinkCodes = ['AUTH_RESET_TOKEN_INVALID', 'AUTH_RESET_TOKEN_EXPIRED', 'AUTH_RESET_TOKEN_USED']

/** Opened from the link in the reset email: `/reset-password?token=…`. */
export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const reset = useResetPassword()
  const error = reset.error instanceof ApiError ? reset.error : undefined
  const code = error?.code
  // A weak or empty password fails validation: 400 VALIDATION_FAILED with the code under `errors.newPassword`
  // (Harmonia-BE ValidationFilter, PasswordRuleExtensions), never as the top-level code.
  const passwordRejected = Boolean(error?.errors?.newPassword)

  if (!token || (code !== undefined && unusableLinkCodes.includes(code))) {
    return (
      <AuthCard
        icon={<CloseCircleOutlined />}
        title="Liên kết không còn hiệu lực"
        description="Liên kết đặt lại mật khẩu không hợp lệ, đã hết hạn hoặc đã được sử dụng. Mỗi liên kết chỉ dùng được một lần trong vòng 1 giờ."
        footer={<Link to={paths.login}>Quay lại đăng nhập</Link>}
      >
        <Button type="primary" block onClick={() => navigate(paths.forgotPassword)}>
          Yêu cầu liên kết mới
        </Button>
      </AuthCard>
    )
  }

  if (reset.isSuccess) {
    return (
      <AuthCard
        icon={<CheckCircleOutlined />}
        title="Đã đặt lại mật khẩu"
        description="Hãy đăng nhập bằng mật khẩu mới. Các phiên đăng nhập trước đó trên mọi thiết bị đã kết thúc."
      >
        <Button type="primary" block onClick={() => navigate(paths.login)}>
          Đăng nhập
        </Button>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Đặt lại mật khẩu"
      description="Nhập mật khẩu mới cho tài khoản Harmonia của bạn."
      footer={<Link to={paths.login}>Quay lại đăng nhập</Link>}
    >
      <ResetPasswordForm
        onSubmit={({ newPassword }) => reset.mutate({ token, newPassword })}
        submitting={reset.isPending}
        failed={reset.isError && !passwordRejected}
        passwordError={passwordRejected ? passwordRuleMessage : undefined}
      />
    </AuthCard>
  )
}
