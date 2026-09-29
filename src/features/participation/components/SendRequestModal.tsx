import { Checkbox, Flex, Modal, Typography } from 'antd'
import { useState } from 'react'
import { SkillTags, useChoirMembers } from '@/features/members'
import { EmptyState, ErrorState, SectionSkeleton } from '@/shared/ui'
import { colors, radius, spacing } from '@/styles/tokens'

export interface SendRequestModalProps {
  open: boolean
  sending?: boolean
  onSend: (memberIds: string[]) => void
  onCancel: () => void
}

/** Choose who receives the program's confirmation round (FE-33); all members are selected by default. */
export function SendRequestModal({ open, sending = false, onSend, onCancel }: SendRequestModalProps) {
  const members = useChoirMembers()
  // Track deselected members so everyone is selected by default, including members loaded later.
  const [deselected, setDeselected] = useState<string[]>([])
  const available = members.data ?? []
  const selected = available.filter((member) => !deselected.includes(member.id)).map((member) => member.id)

  const toggleAll = (checked: boolean) => setDeselected(checked ? [] : available.map((member) => member.id))

  return (
    <Modal
      open={open}
      title="Gửi yêu cầu xác nhận tham gia"
      okText={selected.length ? `Gửi cho ${selected.length} thành viên` : 'Gửi yêu cầu'}
      cancelText="Hủy"
      okButtonProps={{ disabled: selected.length === 0, loading: sending }}
      cancelButtonProps={{ disabled: sending }}
      onOk={() => onSend(selected)}
      onCancel={onCancel}
      afterClose={() => setDeselected([])}
      mask={{ closable: !sending }}
      width={600}
      destroyOnHidden
    >
      {members.isPending && <SectionSkeleton rows={5} label="Đang tải thành viên" />}
      {members.isError && (
        <ErrorState title="Không thể tải thành viên" onRetry={() => members.refetch()} retrying={members.isFetching} />
      )}
      {members.isSuccess && available.length === 0 && <EmptyState title="Chưa có thành viên" />}
      {members.isSuccess && available.length > 0 && (
        <Flex vertical gap={spacing.sm}>
          <Checkbox
            checked={selected.length === available.length}
            indeterminate={selected.length > 0 && selected.length < available.length}
            onChange={(event) => toggleAll(event.target.checked)}
          >
            Chọn tất cả ({selected.length}/{available.length})
          </Checkbox>
          <Checkbox.Group
            value={selected}
            onChange={(values) => setDeselected(available.map((member) => member.id).filter((id) => !values.includes(id)))}
            style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs, maxHeight: 360, overflowY: 'auto' }}
          >
            {available.map((member) => (
              <Checkbox
                key={member.id}
                value={member.id}
                style={{ padding: spacing.sm, border: `1px solid ${colors.border}`, borderRadius: radius.md, marginInlineStart: 0 }}
              >
                <Flex wrap gap={spacing.sm} align="center">
                  <Typography.Text>{member.fullName}</Typography.Text>
                  <SkillTags skills={member.skills} />
                </Flex>
              </Checkbox>
            ))}
          </Checkbox.Group>
        </Flex>
      )}
    </Modal>
  )
}
