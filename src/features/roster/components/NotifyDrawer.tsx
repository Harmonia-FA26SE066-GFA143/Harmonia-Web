import { Checkbox, Flex, Input, Typography, type CheckboxRef } from 'antd'
import { useRef, useState } from 'react'
import { colors, component, spacing } from '@/styles/tokens'
import { CANCEL_LABEL, FormDrawer, Icon } from '@/shared/ui'
import { matchesSearch } from '@/shared/utils/search'

export interface NotifyDrawerProps {
  open: boolean
  /** Assigned members, once each. */
  members: { memberId: string; fullName: string }[]
  sending?: boolean
  onSend: (memberIds: string[]) => void
  onCancel: () => void
}

/** Choose the assigned members who receive the assignment notification (FE-40); all are selected by default. */
export function NotifyDrawer({ open, members, sending = false, onSend, onCancel }: Readonly<NotifyDrawerProps>) {
  const [deselected, setDeselected] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const selectAllRef = useRef<CheckboxRef>(null)
  const selected = members.filter((member) => !deselected.includes(member.memberId)).map((member) => member.memberId)
  const visible = search.trim() ? members.filter((member) => matchesSearch(search, member.fullName)) : members

  const toggleVisible = (checkedIds: string[]) => {
    const visibleIds = new Set(visible.map((member) => member.memberId))
    const nextUnchecked = visible.map((member) => member.memberId).filter((id) => !checkedIds.includes(id))
    setDeselected([...deselected.filter((id) => !visibleIds.has(id)), ...nextUnchecked])
  }

  return (
    <FormDrawer
      open={open}
      title="Gửi thông báo phân công"
      okText={selected.length ? `Gửi cho ${selected.length} thành viên` : 'Gửi thông báo'}
      cancelText={CANCEL_LABEL}
      size={component.drawer.sm}
      initialFocusRef={selectAllRef}
      okButtonProps={{ disabled: selected.length === 0, loading: sending }}
      cancelButtonProps={{ disabled: sending }}
      onOk={() => onSend(selected)}
      onCancel={onCancel}
      afterClose={() => {
        setDeselected([])
        setSearch('')
      }}
      destroyOnHidden
    >
      <Flex vertical gap={spacing.sm}>
        <Typography.Paragraph style={{ color: colors.textMuted, margin: 0 }}>
          Thành viên được chọn sẽ nhận thông báo về vị trí phục vụ của mình.
        </Typography.Paragraph>
        {members.length >= 6 && (
          <Input
            allowClear
            prefix={<Icon name="search" />}
            value={search}
            aria-label="Tìm thành viên nhận thông báo"
            placeholder="Tìm theo họ tên…"
            onChange={(event) => setSearch(event.target.value)}
          />
        )}
        <Checkbox
          ref={selectAllRef}
          checked={selected.length === members.length}
          indeterminate={selected.length > 0 && selected.length < members.length}
          onChange={(event) => setDeselected(event.target.checked ? [] : members.map((member) => member.memberId))}
        >
          Chọn tất cả ({selected.length}/{members.length})
        </Checkbox>
        {visible.length === 0 ? (
          <Typography.Text style={{ color: colors.textMuted }}>Không có thành viên nào khớp từ khóa.</Typography.Text>
        ) : (
          <Checkbox.Group
            value={selected.filter((id) => visible.some((member) => member.memberId === id))}
            onChange={toggleVisible}
            className="hm-choice-list"
          >
            {visible.map((member) => (
              <Checkbox key={member.memberId} value={member.memberId} className="hm-choice-card">
                <Typography.Text strong>{member.fullName}</Typography.Text>
              </Checkbox>
            ))}
          </Checkbox.Group>
        )}
      </Flex>
    </FormDrawer>
  )
}
