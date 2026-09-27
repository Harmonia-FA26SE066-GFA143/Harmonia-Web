import { Button, Descriptions, Flex, Form, Modal, Radio, Tag, Typography } from 'antd'
import { roleLabels, type SystemRole } from '@/shared/types/account'
import { colors, spacing, typography } from '@/styles/tokens'
import { assignableRoles, roleDescriptions } from '../roles'
import type { Account } from '../types'

export interface AssignRoleModalProps {
  /** Account being confirmed or changed; the modal is open while set. */
  account?: Account
  /**
   * `confirm`: pending account, preselects the requested role (DECIDED 2026-09-26).
   * `change`: account with a role; saving is blocked until a different role is chosen.
   */
  mode: 'confirm' | 'change'
  saving?: boolean
  onSubmit: (role: SystemRole) => void
  onCancel: () => void
}

const copy = {
  confirm: { title: 'Xác nhận vai trò', ok: 'Xác nhận' },
  change: { title: 'Thay đổi vai trò', ok: 'Lưu thay đổi' },
}

interface FooterProps {
  okText: string
  current?: SystemRole
  saving: boolean
  onCancel: () => void
}

/** Rendered inside the modal's Form (see modalRender), so it can watch the selected role. */
function AssignRoleFooter({ okText, current, saving, onCancel }: FooterProps) {
  const selected = Form.useWatch<SystemRole | undefined>('role', Form.useFormInstance())
  return (
    <Flex justify="flex-end" gap={spacing.sm}>
      <Button onClick={onCancel} disabled={saving}>
        Hủy
      </Button>
      <Button type="primary" htmlType="submit" loading={saving} disabled={!selected || selected === current}>
        {okText}
      </Button>
    </Flex>
  )
}

/**
 * Picks one FE-48 role (single role per account is an assumption; multiple roles is UNRESOLVED).
 * Guards such as keeping at least one Admin are backend rules (TBD).
 */
export function AssignRoleModal({ account, mode, saving = false, onSubmit, onCancel }: AssignRoleModalProps) {
  const current = mode === 'change' ? account?.role : undefined

  return (
    <Modal
      open={Boolean(account)}
      title={copy[mode].title}
      footer={<AssignRoleFooter okText={copy[mode].ok} current={current} saving={saving} onCancel={onCancel} />}
      onCancel={onCancel}
      mask={{ closable: !saving }}
      destroyOnHidden
      modalRender={(dom) => (
        <Form<{ role: SystemRole }>
          layout="vertical"
          disabled={saving}
          initialValues={{ role: mode === 'confirm' ? account?.requestedRole : account?.role }}
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
            mode === 'confirm'
              ? {
                  key: 'requested',
                  label: 'Vai trò đề nghị',
                  children: account.requestedRole ? roleLabels[account.requestedRole] : 'Không có',
                }
              : { key: 'current', label: 'Vai trò hiện tại', children: account.role ? roleLabels[account.role] : '—' },
          ]}
        />
      )}
      <Form.Item
        label={mode === 'confirm' ? 'Vai trò được xác nhận' : 'Vai trò mới'}
        name="role"
        rules={[{ required: true, message: 'Vui lòng chọn vai trò.' }]}
        extra={mode === 'confirm' ? 'Vai trò đề nghị chỉ để tham khảo; bạn có thể chọn vai trò khác.' : undefined}
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
