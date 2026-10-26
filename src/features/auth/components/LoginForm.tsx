import { Alert, Button, Divider, Flex, Form, Input, Typography } from 'antd'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { paths } from '@/app/router/paths'
import { useContactEmail } from '@/features/settings'
import { spacing } from '@/styles/tokens'
import type { SignInError, SignInValues } from '../types'

/** Feedback shown above the sign-in form. */
export type LoginFeedback = SignInError | { kind: 'member-web' } | { kind: 'session-ended' }

export interface LoginFormProps {
  onSubmit: (values: SignInValues) => void
  submitting?: boolean
  feedback?: LoginFeedback
  /** Another way to sign in, shown under the form after "hoặc" (the Google button). */
  alternative?: ReactNode
}

function FeedbackAlert({ feedback }: Readonly<{ feedback: LoginFeedback }>) {
  const contactEmail = useContactEmail()
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
          description={
            <>
              Vui lòng liên hệ Quản trị viên giáo xứ để được hỗ trợ:{' '}
              <Typography.Link href={`mailto:${contactEmail}`}>{contactEmail}</Typography.Link>
            </>
          }
        />
      )
    case 'member-web':
      // Choir Members have no web workspace (RoleGuard, #25); they use the mobile app (FE-01–FE-14).
      return (
        <Alert
          type="info"
          showIcon
          title="Tài khoản Ca viên sử dụng ứng dụng di động Harmonia"
          description="Vui lòng đăng nhập trên ứng dụng di động để tiếp tục."
        />
      )
    case 'session-ended':
      // apiRequest sends the user here after an expired, revoked or deactivated session.
      return (
        <Alert
          type="info"
          showIcon
          title="Phiên đăng nhập đã kết thúc"
          description="Vui lòng đăng nhập lại để tiếp tục."
        />
      )
    case 'google-not-registered':
      return (
        <Alert
          type="error"
          showIcon
          title="Tài khoản Google này chưa được cấp quyền vào Harmonia."
          description={
            <>
              Hãy đăng nhập bằng email Quản trị viên đã tạo cho bạn, hoặc liên hệ:{' '}
              <Typography.Link href={`mailto:${contactEmail}`}>{contactEmail}</Typography.Link>
            </>
          }
        />
      )
    case 'google-invalid':
      return (
        <Alert
          type="error"
          showIcon
          title="Không xác thực được tài khoản Google."
          description="Vui lòng thử lại, hoặc đăng nhập bằng email và mật khẩu."
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

export function LoginForm({ onSubmit, submitting = false, feedback, alternative }: Readonly<LoginFormProps>) {
  return (
    <Flex vertical gap={spacing.md}>
      {feedback && <FeedbackAlert feedback={feedback} />}
      {/* Not `disabled` while submitting: that would drop the focus of the field in use. The button's loading state and
          the page's pending guard stop a second submit. `noValidate` leaves the messages to Ant Design, in Vietnamese. */}
      <Form<SignInValues> layout="vertical" requiredMark={false} onFinish={onSubmit} noValidate>
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Vui lòng nhập email.' },
            { type: 'email', message: 'Email không hợp lệ.' },
          ]}
        >
          <Input type="email" autoComplete="email" placeholder="ten@giaoxu.org" autoFocus />
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
      {alternative && (
        <>
          <Divider plain style={{ margin: 0 }}>
            hoặc
          </Divider>
          {alternative}
        </>
      )}
    </Flex>
  )
}
