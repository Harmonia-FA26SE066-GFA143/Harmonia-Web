import { Alert, Button, Flex, Form, Input } from 'antd'
import { spacing } from '@/styles/tokens'
import type { PasswordResetRequestValues } from '../types'

export interface ForgotPasswordFormProps {
  onSubmit: (values: PasswordResetRequestValues) => void
  submitting?: boolean
  failed?: boolean
}

export function ForgotPasswordForm({ onSubmit, submitting = false, failed = false }: ForgotPasswordFormProps) {
  const [form] = Form.useForm<PasswordResetRequestValues>()

  return (
    <Flex vertical gap={spacing.md}>
      {failed && (
        <Alert
          type="error"
          showIcon
          title="Không thể gửi yêu cầu"
          description="Đã xảy ra lỗi kết nối với máy chủ. Vui lòng thử lại sau giây lát."
          action={
            <Button size="small" onClick={() => form.submit()}>
              Thử lại
            </Button>
          }
        />
      )}
      <Form<PasswordResetRequestValues> form={form} layout="vertical" requiredMark={false} onFinish={onSubmit} disabled={submitting}>
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
        <Button type="primary" htmlType="submit" block loading={submitting}>
          Gửi yêu cầu
        </Button>
      </Form>
    </Flex>
  )
}
