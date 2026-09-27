import { Form, Input, Modal, Select } from 'antd'
import { roleLabels } from '@/shared/types/account'
import { assignableRoles } from '../roles'
import type { CreateAccountValues } from '../types'

export interface CreateAccountModalProps {
  open: boolean
  saving?: boolean
  onSubmit: (values: CreateAccountValues) => void
  onCancel: () => void
}

/**
 * Admin creates an account with a role directly (FE-47–FE-48; owner decision 2026-09-27, Admin role allowed).
 * Not collected until decided (TBD): initial password / invitation, affiliated choir, initial status.
 */
export function CreateAccountModal({ open, saving = false, onSubmit, onCancel }: CreateAccountModalProps) {
  return (
    <Modal
      open={open}
      title="Tạo tài khoản"
      okText="Tạo tài khoản"
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
          onFinish={(values) =>
            onSubmit({
              ...values,
              fullName: values.fullName.trim(),
              email: values.email.trim(),
              phone: values.phone?.trim() || undefined,
            })
          }
        >
          {dom}
        </Form>
      )}
    >
      <Form.Item
        label="Họ và tên"
        name="fullName"
        rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập họ và tên.' }]}
      >
        <Input autoFocus autoComplete="off" />
      </Form.Item>
      <Form.Item
        label="Email"
        name="email"
        extra="Dùng làm tên đăng nhập."
        rules={[
          { required: true, message: 'Vui lòng nhập email.' },
          { type: 'email', message: 'Email không hợp lệ.' },
        ]}
      >
        <Input inputMode="email" autoComplete="off" placeholder="ten@giaoxu.org" />
      </Form.Item>
      <Form.Item label="Số điện thoại (không bắt buộc)" name="phone">
        <Input type="tel" autoComplete="off" />
      </Form.Item>
      <Form.Item label="Vai trò" name="role" rules={[{ required: true, message: 'Vui lòng chọn vai trò.' }]}>
        <Select
          placeholder="Chọn vai trò"
          options={assignableRoles.map((role) => ({ value: role, label: roleLabels[role] }))}
        />
      </Form.Item>
    </Modal>
  )
}
