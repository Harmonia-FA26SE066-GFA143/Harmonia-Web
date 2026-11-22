import { CheckCircleOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Flex, Typography } from 'antd'
import { Link, Navigate, useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { ApiError } from '@/lib/api/errors'
import { getSession } from '@/lib/auth/session'
import { PageHeader } from '@/shared/ui'
import { colors, component, spacing, typography } from '@/styles/tokens'
import { passwordRuleMessage, ResetPasswordForm } from '../components/ResetPasswordForm'
import { useChangePassword, useSignOut } from '../hooks/useAuthMutations'

const cardStyle = {
  maxWidth: 520,
  background: colors.surface,
  borderColor: colors.border,
}

/**
 * POST /api/auth/change-password for a signed-in user (Harmonia-BE AuthController), hosted inside `AppShell` (R2.8).
 * An Admin-created account lands here in Focused Security Mode until it replaces the emailed first password;
 * voluntary password changes keep full role navigation with a breadcrumb back to Hồ sơ cá nhân.
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
      <Card style={{ ...cardStyle, margin: `${spacing.xl}px auto` }}>
        <Flex vertical align="center" gap={spacing.md} style={{ textAlign: 'center' }}>
          <CheckCircleOutlined style={{ fontSize: 32, color: 'var(--hm-success)' }} />
          <Typography.Title
            level={1}
            style={{
              margin: 0,
              fontFamily: typography.displayFontFamily,
              ...component.pageHeader.title,
              fontVariantNumeric: 'lining-nums',
            }}
          >
            Đã đổi mật khẩu
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
            Hãy đăng nhập bằng mật khẩu mới. Các phiên đăng nhập trước đó trên mọi thiết bị đã kết thúc.
          </Typography.Paragraph>
          <Button type="primary" block onClick={() => navigate(paths.login)}>
            Đăng nhập
          </Button>
        </Flex>
      </Card>
    )
  }

  const session = getSession()
  if (!session) return <Navigate to={paths.login} replace />
  const forced = Boolean(session.user.isPasswordChangeRequired)

  const formNode = (
    <ResetPasswordForm
      askCurrentPassword
      submitText="Đổi mật khẩu"
      onSubmit={({ currentPassword = '', newPassword }) => change.mutate({ currentPassword, newPassword })}
      submitting={change.isPending}
      failed={change.isError && !passwordRejected && !currentRejected}
      passwordError={passwordRejected ? passwordRuleMessage : undefined}
      currentPasswordError={currentRejected ? 'Mật khẩu hiện tại không đúng.' : undefined}
    />
  )

  if (forced) {
    return (
      <Card style={{ ...cardStyle, margin: `${spacing.xl}px auto` }}>
        <Flex vertical gap={spacing.md}>
          <Typography.Title
            level={1}
            style={{
              margin: 0,
              fontFamily: typography.displayFontFamily,
              ...component.pageHeader.title,
              fontVariantNumeric: 'lining-nums',
            }}
          >
            Đổi mật khẩu
          </Typography.Title>
          <Alert
            type="info"
            showIcon
            title="Tài khoản của bạn đang dùng mật khẩu được gửi qua email. Hãy đặt mật khẩu mới trước khi tiếp tục."
          />
          {formNode}
          <Flex justify="center">
            <Button
              type="link"
              loading={signOut.isPending}
              // AuthGuard moves the tab to /login once signOut clears the session.
              onClick={() => signOut.mutate(undefined)}
            >
              Đăng xuất
            </Button>
          </Flex>
        </Flex>
      </Card>
    )
  }

  return (
    <div>
      <PageHeader
        title="Đổi mật khẩu"
        showBreadcrumb
        breadcrumb={[{ title: <Link to={paths.profile}>Hồ sơ cá nhân</Link> }, { title: 'Đổi mật khẩu' }]}
        description="Sau khi đổi, bạn sẽ cần đăng nhập lại trên mọi thiết bị."
      />
      <Card style={cardStyle}>
        {formNode}
        <div style={{ marginTop: spacing.md }}>
          <Link to={paths.profile}>Quay lại hồ sơ cá nhân</Link>
        </div>
      </Card>
    </div>
  )
}
