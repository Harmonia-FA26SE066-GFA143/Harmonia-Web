import { Form, Input, Modal, Typography } from 'antd'
import { spacing } from '@/styles/tokens'
import type { Account } from '../types'

export interface RejectAccountModalProps {
  /** Pending account being rejected; the modal is open while set. */
  account?: Account
  saving?: boolean
  onSubmit: (reason?: string) => void
  onCancel: () => void
}

/**
 * Rejects a pending account with an optional reason (DECIDED 2026-09-26). The account is kept, the user
 * sees the reason when signing in, and the Admin can reopen it later.
 */
export function RejectAccountModal({ account, saving = false, onSubmit, onCancel }: RejectAccountModalProps) {
  return (
    <Modal
      open={Boolean(account)}
      title="Từ chối tài khoản"
      okText="Từ chối"
      cancelText="Hủy"
      okButtonProps={{ htmlType: 'submit', danger: true, loading: saving }}
      cancelButtonProps={{ disabled: saving }}
      onCancel={onCancel}
      mask={{ closable: !saving }}
      destroyOnHidden
      modalRender={(dom) => (
        <Form<{ reason?: string }>
          layout="vertical"
          disabled={saving}
          onFinish={(values) => onSubmit(values.reason?.trim() || undefined)}
        >
          {dom}
        </Form>
      )}
    >
      {account && (
        <Typography.Paragraph style={{ marginBottom: spacing.md }}>
          Từ chối tài khoản của <strong>{account.fullName}</strong> ({account.email})? Tài khoản vẫn được lưu lại
          và có thể mở lại sau.
        </Typography.Paragraph>
      )}
      <Form.Item
        label="Lý do (không bắt buộc)"
        name="reason"
        extra="Người dùng sẽ thấy lý do này khi đăng nhập."
      >
        <Input.TextArea rows={3} />
      </Form.Item>
    </Modal>
  )
}
