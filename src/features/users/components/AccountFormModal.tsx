import { Form, Input, Modal, Select } from 'antd'
import { roleLabels } from '@/shared/types/account'
import { assignableRoles } from '../roles'
import type { Account, CreateAccountValues, UpdateAccountValues } from '../types'

export interface AccountFormModalProps {
  open: boolean
  /** The account being edited; absent when creating one. */
  account?: Account
  saving?: boolean
  /** Shown under the email, e.g. when the backend reports it is taken. */
  emailError?: string
  /** Receives `CreateAccountValues` when creating, `UpdateAccountValues` when editing. */
  onSubmit: (values: CreateAccountValues | UpdateAccountValues) => void
  onCancel: () => void
}

type FormValues = { fullName?: string; email: string; phone?: string; role?: CreateAccountValues['role'] }

/**
 * Admin creates an account (email and one role required, name and phone optional) or edits its email, name and
 * phone (Harmonia-BE CreateUserRequestValidator / UpdateUserRequestValidator). The backend generates the first
 * password and emails it. The role is changed on the Roles page.
 */
export function AccountFormModal({ open, account, saving = false, emailError, onSubmit, onCancel }: AccountFormModalProps) {
  return (
    <Modal
      open={open}
      title={account ? 'Sửa tài khoản' : 'Tạo tài khoản'}
      okText={account ? 'Lưu thay đổi' : 'Tạo tài khoản'}
      cancelText="Hủy"
      okButtonProps={{ htmlType: 'submit', loading: saving }}
      cancelButtonProps={{ disabled: saving }}
      onCancel={onCancel}
      mask={{ closable: !saving }}
      destroyOnHidden
      modalRender={(dom) => (
        <Form<FormValues>
          layout="vertical"
          disabled={saving}
          initialValues={account && { fullName: account.fullName, email: account.email, phone: account.phone ?? undefined }}
          onFinish={({ fullName, email, phone, role }) =>
            onSubmit({
              email: email.trim(),
              fullName: fullName?.trim() || undefined,
              phone: phone?.trim() || undefined,
              ...(role && { role }),
            } as CreateAccountValues | UpdateAccountValues)
          }
        >
          {dom}
        </Form>
      )}
    >
      <Form.Item
        label="Email"
        name="email"
        extra={account ? 'Dùng làm tên đăng nhập.' : 'Dùng làm tên đăng nhập. Mật khẩu đầu tiên được tạo tự động và gửi tới email này.'}
        validateStatus={emailError ? 'error' : undefined}
        help={emailError}
        rules={[
          { required: true, message: 'Vui lòng nhập email.' },
          { type: 'email', message: 'Email không hợp lệ.' },
        ]}
      >
        <Input autoFocus inputMode="email" autoComplete="off" placeholder="ten@giaoxu.org" />
      </Form.Item>
      <Form.Item
        label="Họ và tên (không bắt buộc)"
        name="fullName"
        rules={[{ max: 100, message: 'Họ và tên tối đa 100 ký tự.' }]}
      >
        <Input autoComplete="off" />
      </Form.Item>
      <Form.Item
        label="Số điện thoại (không bắt buộc)"
        name="phone"
        rules={[{ max: 20, message: 'Số điện thoại tối đa 20 ký tự.' }]}
      >
        <Input type="tel" autoComplete="off" />
      </Form.Item>
      {!account && (
        <Form.Item label="Vai trò" name="role" rules={[{ required: true, message: 'Vui lòng chọn vai trò.' }]}>
          <Select
            placeholder="Chọn vai trò"
            options={assignableRoles.map((role) => ({ value: role, label: roleLabels[role] }))}
          />
        </Form.Item>
      )}
    </Modal>
  )
}
