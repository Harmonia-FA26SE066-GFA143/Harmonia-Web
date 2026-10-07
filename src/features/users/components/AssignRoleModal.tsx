import { Button, Descriptions, Flex, Form, Modal, Radio, Tag, Typography } from 'antd'
import { roleLabels, type SystemRole } from '@/shared/types/account'
import { colors, spacing, typography } from '@/styles/tokens'
import { assignableRoles, roleDescriptions } from '../roles'
import type { Account } from '../types'

export interface AssignRoleModalProps {
  /** Account whose role is changed; the modal is open while set. */
  account?: Account
  saving?: boolean
  onSubmit: (role: SystemRole) => void
  onCancel: () => void
}

interface FooterProps {
  current?: SystemRole
  saving: boolean
  onCancel: () => void
}

/** Rendered inside the modal's Form (see modalRender), so it can watch the selected role. */
function AssignRoleFooter({ current, saving, onCancel }: FooterProps) {
  const selected = Form.useWatch<SystemRole | undefined>('role', Form.useFormInstance())
  return (
    <Flex justify="flex-end" gap={spacing.sm}>
      <Button onClick={onCancel} disabled={saving}>
        Hủy
      </Button>
      <Button type="primary" htmlType="submit" loading={saving} disabled={!selected || selected === current}>
        Lưu thay đổi
      </Button>
    </Flex>
  )
}

/**
 * Picks one FE-48 role (`PUT /api/users/{id}/role`: one role per account). Saving is blocked until a different role
 * is chosen. The backend refuses the Admin's own account and removing the last active Admin.
 */
export function AssignRoleModal({ account, saving = false, onSubmit, onCancel }: AssignRoleModalProps) {
  const current = account?.role

  return (
    <Modal
      open={Boolean(account)}
      title="Thay đổi vai trò"
      footer={<AssignRoleFooter current={current} saving={saving} onCancel={onCancel} />}
      onCancel={onCancel}
      mask={{ closable: !saving }}
      destroyOnHidden
      modalRender={(dom) => (
        <Form<{ role: SystemRole }>
          layout="vertical"
          disabled={saving}
          initialValues={{ role: current }}
          onFinish={(values) => onSubmit(values.role)}
        >
          {dom}
        </Form>
      )}
    >
      {account && (
        <Descriptions
          size="small"
          column={1}
          style={{ marginBottom: spacing.md }}
          items={[
            { key: 'name', label: 'Tài khoản', children: `${account.fullName} (${account.email})` },
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
    </Modal>
  )
}
