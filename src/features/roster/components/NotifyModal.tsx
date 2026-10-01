import { Checkbox, Flex, Modal, Typography } from 'antd'
import { useState } from 'react'
import { colors, spacing } from '@/styles/tokens'

export interface NotifyModalProps {
  open: boolean
  /** Assigned members, once each. */
  members: { memberId: string; fullName: string }[]
  sending?: boolean
  onSend: (memberIds: string[]) => void
  onCancel: () => void
}

/** Choose the assigned members who receive the assignment notification (FE-40); all are selected by default. */
export function NotifyModal({ open, members, sending = false, onSend, onCancel }: NotifyModalProps) {
  const [deselected, setDeselected] = useState<string[]>([])
  const selected = members.filter((member) => !deselected.includes(member.memberId)).map((member) => member.memberId)

  return (
    <Modal
      open={open}
      title="Gửi thông báo phân công"
      okText={selected.length ? `Gửi cho ${selected.length} thành viên` : 'Gửi thông báo'}
      cancelText="Hủy"
      okButtonProps={{ disabled: selected.length === 0, loading: sending }}
      cancelButtonProps={{ disabled: sending }}
      onOk={() => onSend(selected)}
      onCancel={onCancel}
      afterClose={() => setDeselected([])}
      mask={{ closable: !sending }}
      destroyOnHidden
    >
      <Typography.Paragraph style={{ color: colors.textMuted }}>
        Thành viên được chọn sẽ nhận thông báo về vị trí phục vụ của mình.
      </Typography.Paragraph>
      <Flex vertical gap={spacing.xs}>
        <Checkbox
          checked={selected.length === members.length}
          indeterminate={selected.length > 0 && selected.length < members.length}
          onChange={(event) => setDeselected(event.target.checked ? [] : members.map((member) => member.memberId))}
        >
          Chọn tất cả ({selected.length}/{members.length})
        </Checkbox>
        <Checkbox.Group
          value={selected}
          onChange={(values) => setDeselected(members.map((member) => member.memberId).filter((id) => !values.includes(id)))}
          options={members.map((member) => ({ value: member.memberId, label: member.fullName }))}
          style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}
        />
      </Flex>
    </Modal>
  )
}
