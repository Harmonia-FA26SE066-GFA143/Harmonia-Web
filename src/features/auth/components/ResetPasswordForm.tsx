import { Alert, Button, Flex, Form, Input } from 'antd'
import { spacing } from '@/styles/tokens'
import type { NewPasswordFormValues } from '../types'

/** Backend rule for a new password (Harmonia-BE PasswordRuleExtensions.StrongPassword). */
export const passwordRuleMessage = 'Mật khẩu cần ít nhất 8 ký tự, gồm cả chữ và số.'

function isStrongPassword(value: string) {
  return value.length >= 8 && /\p{L}/u.test(value) && /\d/.test(value)
}

export interface ResetPasswordFormProps {
  onSubmit: (values: NewPasswordFormValues) => void
  submitting?: boolean
  /** The request failed for a reason the form cannot point at (connection, server). */
  failed?: boolean
  /** The backend rejected the new password. */
  passwordError?: string
  /** Change form: also asks for the current password. */
  askCurrentPassword?: boolean
  /** The backend rejected the current password. */
  currentPasswordError?: string
  submitText?: string
}

/** New password with confirmation, for the reset link and for changing the password while signed in. */
export function ResetPasswordForm({
  onSubmit,
  submitting = false,
  failed = false,
  passwordError,
  askCurrentPassword = false,
  currentPasswordError,
  submitText = 'Đặt lại mật khẩu',
}: ResetPasswordFormProps) {
  const [form] = Form.useForm<NewPasswordFormValues>()

  return (
    <Flex vertical gap={spacing.md}>
      {failed && (
        <Alert
          type="error"
          showIcon
          title={askCurrentPassword ? 'Không thể đổi mật khẩu' : 'Không thể đặt lại mật khẩu'}
          description="Đã xảy ra lỗi khi kết nối máy chủ. Vui lòng thử lại sau giây lát."
          action={
            <Button size="small" onClick={() => form.submit()}>
              Thử lại
            </Button>
          }
        />
      )}
      <Form<NewPasswordFormValues> form={form} layout="vertical" requiredMark={false} onFinish={onSubmit} disabled={submitting}>
        {askCurrentPassword && (
          <Form.Item
            label="Mật khẩu hiện tại"
            name="currentPassword"
            validateStatus={currentPasswordError ? 'error' : undefined}
            help={currentPasswordError}
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại.' }]}
          >
            <Input.Password autoComplete="current-password" autoFocus />
          </Form.Item>
        )}
        <Form.Item
          label="Mật khẩu mới"
          name="newPassword"
          validateStatus={passwordError ? 'error' : undefined}
          help={passwordError}
          rules={[
            { required: true, message: 'Vui lòng nhập mật khẩu mới.' },
            {
              validator: (_, value?: string) =>
                !value || isStrongPassword(value) ? Promise.resolve() : Promise.reject(new Error(passwordRuleMessage)),
            },
          ]}
        >
          <Input.Password autoComplete="new-password" placeholder="Ít nhất 8 ký tự, gồm chữ và số" />
        </Form.Item>
        <Form.Item
          label="Xác nhận mật khẩu"
          name="confirmPassword"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: 'Vui lòng nhập lại mật khẩu mới.' },
            ({ getFieldValue }) => ({
              validator: (_, value?: string) =>
                !value || value === getFieldValue('newPassword')
                  ? Promise.resolve()
                  : Promise.reject(new Error('Mật khẩu xác nhận không khớp.')),
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" placeholder="Nhập lại mật khẩu mới" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block loading={submitting}>
          {submitText}
        </Button>
      </Form>
    </Flex>
  )
}
