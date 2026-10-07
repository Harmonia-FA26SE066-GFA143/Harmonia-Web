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

/**
 * Admin creates an account with an initial password and one role, or edits its name and email
 * (Harmonia-BE CreateUserRequestValidator / UpdateUserRequestValidator). The role is changed on the Roles page.
 */
export function AccountFormModal({ open, account, saving = false, emailError, onSubmit, onCancel }: AccountFormModalProps) {
  const okText = account ? 'Lưu thay đổi' : 'Tạo tài khoản'

  return (
    <Modal
      open={open}
      title={account ? 'Sửa tài khoản' : 'Tạo tài khoản'}
      okText={okText}
      cancelText="Hủy"
      okButtonProps={{ htmlType: 'submit', loading: saving }}
      cancelButtonProps={{ disabled: saving }}
      onCancel={onCancel}
      mask={{ closable: !saving }}
      destroyOnHidden
      modalRender={(dom) => (
        <Form<CreateAccountValues>
          layout="vertical"
          disabled={saving}
          initialValues={account && { fullName: account.fullName, email: account.email }}
          onFinish={(values) => onSubmit({ ...values, fullName: values.fullName.trim(), email: values.email.trim() })}
        >
          {dom}
        </Form>
      )}
    >
      <Form.Item
        label="Họ và tên"
        name="fullName"
        rules={[
          { required: true, whitespace: true, message: 'Vui lòng nhập họ và tên.' },
          { max: 100, message: 'Họ và tên tối đa 100 ký tự.' },
        ]}
      >
        <Input autoFocus autoComplete="off" />
      </Form.Item>
      <Form.Item
        label="Email"
        name="email"
        extra="Dùng làm tên đăng nhập."
        validateStatus={emailError ? 'error' : undefined}
        help={emailError}
        rules={[
          { required: true, message: 'Vui lòng nhập email.' },
          { type: 'email', message: 'Email không hợp lệ.' },
        ]}
      >
        <Input inputMode="email" autoComplete="off" placeholder="ten@giaoxu.org" />
      </Form.Item>
      {!account && (
        <>
          <Form.Item
            label="Mật khẩu ban đầu"
            name="password"
            extra="Tối thiểu 8 ký tự. Hãy gửi mật khẩu này cho người dùng."
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu.' },
              { min: 8, message: 'Mật khẩu cần ít nhất 8 ký tự.' },
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item label="Vai trò" name="role" rules={[{ required: true, message: 'Vui lòng chọn vai trò.' }]}>
            <Select
              placeholder="Chọn vai trò"
              options={assignableRoles.map((role) => ({ value: role, label: roleLabels[role] }))}
            />
          </Form.Item>
        </>
      )}
    </Modal>
  )
}
