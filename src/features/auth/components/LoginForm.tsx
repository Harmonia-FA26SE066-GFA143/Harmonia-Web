import { Alert, Button, Flex, Form, Input } from 'antd'
import { Link } from 'react-router'
import { paths } from '@/app/router/paths'
import { spacing } from '@/styles/tokens'
import type { SignInError, SignInValues } from '../types'

/** Feedback shown above the sign-in form. */
export type LoginFeedback = SignInError | { kind: 'member-web' }

export interface LoginFormProps {
  onSubmit: (values: SignInValues) => void
  submitting?: boolean
  feedback?: LoginFeedback
}

function FeedbackAlert({ feedback }: { feedback: LoginFeedback }) {
  switch (feedback.kind) {
    case 'invalid-credentials':
      return (
        <Alert
          type="error"
          showIcon
          title="Email hoặc mật khẩu không chính xác."
          description="Vui lòng kiểm tra lại thông tin đăng nhập."
        />
      )
    case 'inactive':
      return (
        <Alert
          type="error"
          showIcon
          title="Tài khoản đã bị vô hiệu hoá"
          description="Vui lòng liên hệ Quản trị viên giáo xứ để được hỗ trợ."
        />
      )
    case 'member-web':
      // TBD: web access for the Choir Member role is not specified; members use the mobile app (FE-01–FE-14).
      return (
        <Alert
          type="info"
          showIcon
          title="Tài khoản Ca viên sử dụng ứng dụng di động Harmonia"
          description={
            <>
              Trên web, bạn có thể xem <Link to={paths.profile}>hồ sơ cá nhân</Link>.
            </>
          }
        />
      )
    case 'unavailable':
      return (
        <Alert
          type="error"
          showIcon
          title="Không thể đăng nhập lúc này"
          description="Đã xảy ra lỗi khi kết nối máy chủ. Vui lòng thử lại sau."
        />
      )
  }
}

export function LoginForm({ onSubmit, submitting = false, feedback }: LoginFormProps) {
  return (
    <Flex vertical gap={spacing.md}>
      {feedback && <FeedbackAlert feedback={feedback} />}
      <Form<SignInValues> layout="vertical" requiredMark={false} onFinish={onSubmit} disabled={submitting}>
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Vui lòng nhập email.' },
            { type: 'email', message: 'Email không hợp lệ.' },
          ]}
        >
          <Input type="email" autoComplete="email" placeholder="ten@giaoxu.org" />
        </Form.Item>
        <Form.Item
          label="Mật khẩu"
          name="password"
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu.' }]}
          style={{ marginBottom: spacing.sm }}
        >
          <Input.Password autoComplete="current-password" placeholder="Nhập mật khẩu" />
        </Form.Item>
        <Flex justify="flex-end" style={{ marginBottom: spacing.lg }}>
          <Link to={paths.forgotPassword}>Quên mật khẩu?</Link>
        </Flex>
        <Button type="primary" htmlType="submit" block loading={submitting}>
          Đăng nhập
        </Button>
      </Form>
    </Flex>
  )
}
