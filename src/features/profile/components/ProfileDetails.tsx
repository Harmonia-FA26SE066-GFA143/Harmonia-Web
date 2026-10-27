import { EditOutlined } from '@ant-design/icons'
import { Button, Descriptions, Flex, Input, Tag, Typography } from 'antd'
import { useEffect, useRef } from 'react'
import { roleLabels } from '@/shared/types/account'
import { colors, radius, spacing } from '@/styles/tokens'
import type { Profile, ProfileUpdateValues } from '../types'
import { Form } from '@/shared/ui'

export interface ProfileDetailsProps {
  profile: Profile
  editing: boolean
  saving?: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: (values: ProfileUpdateValues) => void
}

/** Personal information panel with view and edit modes. Email and role are read-only here. */
export function ProfileDetails({ profile, editing, saving = false, onEdit, onCancel, onSave }: Readonly<ProfileDetailsProps>) {
  const [form] = Form.useForm<ProfileUpdateValues>()

  // Leaving edit mode removes the form (and the focused control), so the focus goes back to the button that opened it.
  const editButton = useRef<HTMLButtonElement>(null)
  const wasEditing = useRef(false)
  useEffect(() => {
    if (wasEditing.current && !editing) editButton.current?.focus()
    wasEditing.current = editing
  }, [editing])

  const readOnlyItems = [
    { key: 'email', label: 'Email', children: profile.email },
    { key: 'role', label: 'Vai trò', children: <Tag>{roleLabels[profile.role]}</Tag> },
  ]

  return (
    <section
      aria-labelledby="profile-info-heading"
      style={{
        padding: spacing.lg,
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.lg,
      }}
    >
      <Flex justify="space-between" align="center" wrap gap={spacing.sm} style={{ marginBottom: spacing.md }}>
        <Typography.Title id="profile-info-heading" level={2} style={{ margin: 0 }}>
          Thông tin cá nhân
        </Typography.Title>
        {!editing && (
          <Button ref={editButton} icon={<EditOutlined />} onClick={onEdit}>
            Chỉnh sửa
          </Button>
        )}
      </Flex>

      {editing ? (
        // Not `disabled` while saving (that would drop the focus of the field in use); the page ignores a second save.
        // The buttons are submit buttons inside the form, so Enter in a field saves too.
        <Form<ProfileUpdateValues>
          form={form}
          layout="vertical"
          initialValues={{ fullName: profile.fullName, phone: profile.phone }}
          onFinish={onSave}
          style={{ maxWidth: 560 }}
        >
          <Form.Item
            label="Họ và tên (không bắt buộc)"
            name="fullName"
            rules={[{ max: 100, message: 'Họ và tên tối đa 100 ký tự.' }]}
          >
            <Input autoComplete="name" autoFocus />
          </Form.Item>
          <Form.Item
            label="Số điện thoại (không bắt buộc)"
            name="phone"
            rules={[{ max: 20, message: 'Số điện thoại tối đa 20 ký tự.' }]}
          >
            <Input type="tel" autoComplete="tel" />
          </Form.Item>
          <Descriptions column={1} size="small" items={readOnlyItems} />
          <Typography.Paragraph style={{ margin: `${spacing.sm}px 0 ${spacing.lg}px`, color: colors.textMuted }}>
            Email và vai trò không chỉnh sửa tại đây.
          </Typography.Paragraph>
          <Flex gap={spacing.sm}>
            <Button onClick={onCancel} disabled={saving}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              Lưu thay đổi
            </Button>
          </Flex>
        </Form>
      ) : (
        <Descriptions
          column={1}
          items={[
            { key: 'fullName', label: 'Họ và tên', children: profile.fullName || 'Chưa cập nhật' },
            readOnlyItems[0],
            { key: 'phone', label: 'Số điện thoại', children: profile.phone || 'Chưa cập nhật' },
            ...readOnlyItems.slice(1),
          ]}
        />
      )}
    </section>
  )
}
