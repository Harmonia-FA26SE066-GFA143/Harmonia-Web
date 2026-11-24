import { Alert, Button, Flex, Input } from 'antd'
import { spacing } from '@/styles/tokens'
import type { PasswordResetRequestValues } from '../types'
import { Form } from '@/shared/ui'

export interface ForgotPasswordFormProps {
  onSubmit: (values: PasswordResetRequestValues) => void
  submitting?: boolean
  failed?: boolean
  /** 429 RATE_LIMIT_EXCEEDED: more than 10 requests a minute from this address (BE 14dabd3). */
  rateLimited?: boolean
}

export function ForgotPasswordForm({ onSubmit, submitting = false, failed = false, rateLimited = false }: Readonly<ForgotPasswordFormProps>) {
  const [form] = Form.useForm<PasswordResetRequestValues>()

  return (
    <Flex vertical gap={spacing.md}>
      {failed && (
        <Alert
          type="error"
          showIcon
          title="Không thể gửi yêu cầu"
          description={rateLimited ? 'Bạn đã thử quá nhiều lần trong một phút. Vui lòng đợi một phút rồi thử lại.' : 'Đã xảy ra lỗi kết nối với máy chủ. Vui lòng thử lại sau giây lát.'}
          action={
            <Button size="small" onClick={() => form.submit()}>
              Thử lại
            </Button>
          }
        />
      )}
      <Form<PasswordResetRequestValues> form={form} layout="vertical" requiredMark={false} onFinish={(values) => !submitting && onSubmit(values)}>
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
        <Button type="primary" htmlType="submit" block loading={submitting}>
          Gửi yêu cầu
        </Button>
      </Form>
    </Flex>
  )
}
