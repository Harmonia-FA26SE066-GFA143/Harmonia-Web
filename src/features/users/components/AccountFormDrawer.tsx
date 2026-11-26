import { Input, Radio, Select, type InputRef } from 'antd'
import { useRef } from 'react'
import { roleLabels } from '@/shared/types/account'
import { assignableRoles } from '../roles'
import type { Account, CreateAccountValues, UpdateAccountValues } from '../types'
import { genderOptions, saintNameRules, type Gender } from '@/shared/utils/personName'
import { CANCEL_LABEL, Form, FormDrawer, SELECT_POPUP_PROPS } from '@/shared/ui'
import { component } from '@/styles/tokens'

export interface AccountFormDrawerProps {
  open: boolean
  /** The account being edited; absent when creating one. */
  account?: Account
  saving?: boolean
  /** Shown under the email, e.g. when the backend reports it is taken. */
  emailError?: string
  /** The email was edited, so a backend error shown under it no longer applies. */
  onEmailChange?: () => void
  /** Receives `CreateAccountValues` when creating, `UpdateAccountValues` when editing. */
  onSubmit: (values: CreateAccountValues | UpdateAccountValues) => void
  onCancel: () => void
}

type FormValues = { fullName?: string; email: string; phone?: string; saintName?: string; gender?: Gender; role?: CreateAccountValues['role'] }

/**
 * Admin creates an account (email and one role required, name and phone optional) or edits its email, name and
 * phone (Harmonia-BE CreateUserRequestValidator / UpdateUserRequestValidator). The backend generates the first
 * password and emails it. The role is changed on the Roles page.
 */
export function AccountFormDrawer({ open, account, saving = false, emailError, onEmailChange, onSubmit, onCancel }: Readonly<AccountFormDrawerProps>) {
  const emailRef = useRef<InputRef>(null)
  return (
    <FormDrawer
      open={open}
      title={account ? 'Sửa tài khoản' : 'Tạo tài khoản'}
      okText={account ? 'Lưu thay đổi' : 'Tạo tài khoản'}
      size={component.drawer.md}
      cancelText={CANCEL_LABEL}
      initialFocusRef={emailRef}
      okButtonProps={{ htmlType: 'submit', loading: saving }}
      cancelButtonProps={{ disabled: saving }}
      onCancel={onCancel}
      destroyOnHidden
      drawerRender={(dom) => (
        <Form<FormValues>
          layout="vertical"
          onValuesChange={(changed) => {
            if ('email' in changed) onEmailChange?.()
          }}
          initialValues={account && { fullName: account.fullName, email: account.email, phone: account.phone ?? undefined, saintName: account.saintName ?? undefined, gender: account.gender ?? undefined }}
          onFinish={({ fullName, email, phone, saintName, gender, role }) =>
            onSubmit({
              email: email.trim(),
              gender,
              fullName: fullName?.trim() || undefined,
              phone: phone?.trim() || undefined,
              // PUT replaces every field: the saint name is always sent so editing the email does not clear it.
              saintName: saintName?.trim() || undefined,
              ...(role && { role }),
            } as CreateAccountValues | UpdateAccountValues)
          }
        >
          {dom}
        </Form>
      )}
    >
      <div className="hm-form-section">
        <p className="hm-rubric">Tài khoản đăng nhập</p>
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
          <Input ref={emailRef} inputMode="email" autoComplete="off" placeholder="ten@giaoxu.org" />
        </Form.Item>
        {!account && (
          <Form.Item label="Vai trò" name="role" rules={[{ required: true, message: 'Vui lòng chọn vai trò.' }]}>
            <Select
              {...SELECT_POPUP_PROPS}
              placeholder="Chọn vai trò"
              options={assignableRoles.map((role) => ({ value: role, label: roleLabels[role] }))}
            />
          </Form.Item>
        )}
      </div>
      <div className="hm-form-section">
        <p className="hm-rubric">Thông tin cá nhân</p>
        <div className="hm-form-row-asymmetric">
          <Form.Item label="Tên thánh" name="saintName" rules={saintNameRules}>
            <Input autoComplete="off" placeholder="Ví dụ: Giuse" />
          </Form.Item>
          <Form.Item
            label="Họ và tên"
            name="fullName"
            rules={[{ max: 100, message: 'Họ và tên tối đa 100 ký tự.' }]}
          >
            <Input autoComplete="off" placeholder="Ví dụ: Trần Minh Tâm" />
          </Form.Item>
        </div>
        <div className="hm-form-row-2">
          {/* Required on a new account (CreateUserRequestValidator); an older account may still have none. */}
          <Form.Item label="Giới tính" name="gender" rules={account ? undefined : [{ required: true, message: 'Vui lòng chọn giới tính.' }]}>
            <Radio.Group optionType="button" options={genderOptions} />
          </Form.Item>
          <Form.Item
            label="Số điện thoại"
            name="phone"
            rules={[{ max: 20, message: 'Số điện thoại tối đa 20 ký tự.' }]}
          >
            <Input type="tel" autoComplete="off" placeholder="Ví dụ: 0901 234 567" />
          </Form.Item>
        </div>
      </div>
    </FormDrawer>
  )
}
