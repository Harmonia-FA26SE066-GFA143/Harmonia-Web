import { Alert, Button, Flex, Form, Input, Radio } from 'antd'
import { requestableRoles, roleLabels } from '@/shared/types/account'
import { spacing } from '@/styles/tokens'
import type { RegistrationError, RegistrationValues } from '../types'

export interface RegisterFormProps {
  onSubmit: (values: RegistrationValues) => void
  submitting?: boolean
  error?: RegistrationError
}

/**
 * Self-registration form (docs/local/business/roles-permissions.md, DECIDED 2026-09-26).
 * Required: full name, email, password, confirmation, requested role. Optional: phone. No skills.
 * Password strength and phone format rules are not specified (TBD); only UX checks are applied.
 */
export function RegisterForm({ onSubmit, submitting = false, error }: RegisterFormProps) {
  return (
    <Flex vertical gap={spacing.md}>
      {error?.kind === 'email-taken' && (
        <Alert
          type="error"
          showIcon
          title="Email này đã được đăng ký."
          description="Vui lòng đăng nhập hoặc dùng một email khác."
        />
      )}
      {error?.kind === 'unavailable' && (
        <Alert
          type="error"
          showIcon
          title="Không thể đăng ký lúc này"
          description="Hệ thống chưa kết nối được máy chủ. Vui lòng thử lại sau."
        />
      )}
      <Form<RegistrationValues> layout="vertical" onFinish={onSubmit} disabled={submitting}>
        <Form.Item
          label="Họ và tên"
          name="fullName"
          rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập họ và tên.' }]}
        >
          <Input autoComplete="name" />
        </Form.Item>
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
        <Form.Item label="Số điện thoại (không bắt buộc)" name="phone">
          <Input type="tel" autoComplete="tel" />
        </Form.Item>
        <Form.Item
          label="Vai trò mong muốn"
          name="requestedRole"
          rules={[{ required: true, message: 'Vui lòng chọn vai trò mong muốn.' }]}
          extra="Vai trò chỉ là đề nghị. Quản trị viên sẽ xác nhận hoặc chọn vai trò phù hợp cho tài khoản."
        >
          <Radio.Group
            options={requestableRoles.map((role) => ({ value: role, label: roleLabels[role] }))}
            style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}
          />
        </Form.Item>
        <Form.Item
          label="Mật khẩu"
          name="password"
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu.' }]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          label="Xác nhận mật khẩu"
          name="confirmPassword"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Vui lòng nhập lại mật khẩu.' },
            ({ getFieldValue }) => ({
              validator: (_, value) =>
                !value || getFieldValue('password') === value
                  ? Promise.resolve()
                  : Promise.reject(new Error('Mật khẩu xác nhận không khớp.')),
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block loading={submitting}>
          Đăng ký
        </Button>
      </Form>
    </Flex>
  )
}
