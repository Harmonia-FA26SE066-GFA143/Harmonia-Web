import { Alert, Descriptions, Flex, Radio, Tag, Typography } from 'antd'
import { useEffect } from 'react'
import { roleLabels, type SystemRole } from '@/shared/types/account'
import { CANCEL_LABEL, Form, FormDrawer } from '@/shared/ui'
import { colors, component, spacing, typography } from '@/styles/tokens'
import { assignableRoles, roleDescriptions } from '../roles'
import type { Account } from '../types'

export interface AssignRoleDrawerProps {
  /** Account whose role is changed; the drawer is open while set. */
  account?: Account
  saving?: boolean
  onSubmit: (role: SystemRole) => void
  onCancel: () => void
}

/**
 * Picks one FE-48 role (`PUT /api/users/{id}/role`: one role per account). Saving is blocked until a different role
 * is chosen. The backend refuses the Admin's own account and removing the last active Admin.
 */
export function AssignRoleDrawer({ account, saving = false, onSubmit, onCancel }: Readonly<AssignRoleDrawerProps>) {
  const current = account?.role
  const [form] = Form.useForm<{ role: SystemRole }>()
  const selected = Form.useWatch('role', form)

  // The drawer may reopen for another account before its closing motion has destroyed the form: never keep A's choice for B.
  useEffect(() => {
    if (account) form.setFieldsValue({ role: account.role })
    else form.resetFields()
  }, [account, form])

  return (
    <FormDrawer
      open={Boolean(account)}
      title="Thay đổi vai trò"
      size={component.drawer.sm}
      okText="Lưu thay đổi"
      cancelText={CANCEL_LABEL}
      okButtonProps={{ htmlType: 'submit', loading: saving, disabled: !selected || selected === current }}
      cancelButtonProps={{ disabled: saving }}
      onCancel={onCancel}
      destroyOnHidden
      drawerRender={(dom) => (
        <Form<{ role: SystemRole }> form={form} layout="vertical" initialValues={{ role: current }} onFinish={(values) => onSubmit(values.role)}>
          {dom}
        </Form>
      )}
    >
      {account && (
        <Descriptions
          className="hm-key-value"
          size="small"
          column={1}
          style={{ marginBottom: spacing.md }}
          items={[
            { key: 'name', label: 'Tài khoản', children: account.fullName ? `${account.fullName} (${account.email})` : account.email },
            { key: 'current', label: 'Vai trò hiện tại', children: roleLabels[account.role] },
          ]}
        />
      )}
      <Form.Item
        label="Vai trò mới"
        name="role"
        rules={[{ required: true, message: 'Vui lòng chọn vai trò.' }]}
        extra="Người dùng sẽ phải đăng nhập lại sau khi đổi vai trò."
      >
        <Radio.Group style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          {assignableRoles.map((role) => (
            <Radio key={role} value={role}>
              <Flex vertical>
                <Flex align="center" gap={spacing.xs}>
                  <Typography.Text strong>{roleLabels[role]}</Typography.Text>
                  {role === current && <Tag style={{ marginInlineEnd: 0 }}>Hiện tại</Tag>}
                </Flex>
                <Typography.Text style={{ color: colors.textMuted, fontSize: typography.metadata.fontSize }}>
                  {roleDescriptions[role]}
                </Typography.Text>
              </Flex>
            </Radio>
          ))}
        </Radio.Group>
      </Form.Item>
      {/* UserService.AssignRoleAsync: a Choir Member leaving the role leaves every choir, and coming back restores none. */}
      {current === 'member' && selected && selected !== 'member' && (
        <Alert
          type="warning"
          showIcon
          style={{ marginTop: spacing.sm }}
          title="Đổi vai trò sẽ rút tài khoản này khỏi các ca đoàn hiện tại và gỡ khỏi xác nhận tham gia, phân công của các lễ sắp tới; không tự khôi phục nếu đổi lại làm Ca viên."
        />
      )}
    </FormDrawer>
  )
}
