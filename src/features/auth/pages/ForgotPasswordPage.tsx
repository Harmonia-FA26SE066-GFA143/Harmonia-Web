import { MailOutlined } from '@ant-design/icons'
import { Button, Flex } from 'antd'
import { Link, useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { spacing } from '@/styles/tokens'
import { AuthCard } from '../components/AuthCard'
import { ForgotPasswordForm } from '../components/ForgotPasswordForm'
import { useRequestPasswordReset } from '../hooks/useAuthMutations'

// The backend answers 204 for every email, so the copy stays generic and does not reveal whether an email is
// registered. The emailed link opens /reset-password and works once, for 1 hour.
export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const resetRequest = useRequestPasswordReset()

  if (resetRequest.isSuccess) {
    return (
      <AuthCard
        icon={<MailOutlined />}
        title="Yêu cầu đã được gửi"
        description="Nếu email đã được đăng ký, bạn sẽ nhận được liên kết đặt lại mật khẩu, có hiệu lực trong 1 giờ. Vui lòng kiểm tra cả thư mục thư rác."
      >
        <Flex vertical gap={spacing.sm}>
          <Button type="primary" block onClick={() => navigate(paths.login)}>
            Quay lại đăng nhập
          </Button>
          <Button block onClick={() => resetRequest.reset()}>
            Gửi lại yêu cầu
          </Button>
        </Flex>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Quên mật khẩu?"
      description="Nhập email đã đăng ký để nhận hướng dẫn đặt lại mật khẩu."
      footer={<Link to={paths.login}>Quay lại đăng nhập</Link>}
    >
      <ForgotPasswordForm
        onSubmit={(values) => resetRequest.mutate(values)}
        submitting={resetRequest.isPending}
        failed={resetRequest.isError}
      />
    </AuthCard>
  )
}
