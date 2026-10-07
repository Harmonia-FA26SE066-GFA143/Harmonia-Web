import { EditOutlined } from '@ant-design/icons'
import { Button, Descriptions, Flex, Form, Input, Tag, Typography } from 'antd'
import { roleLabels } from '@/shared/types/account'
import { colors, radius, spacing } from '@/styles/tokens'
import type { Profile, ProfileUpdateValues } from '../types'

export interface ProfileDetailsProps {
  profile: Profile
  editing: boolean
  saving?: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: (values: ProfileUpdateValues) => void
}

/** Personal information panel with view and edit modes. Email and role are read-only here. */
export function ProfileDetails({ profile, editing, saving = false, onEdit, onCancel, onSave }: ProfileDetailsProps) {
  const [form] = Form.useForm<ProfileUpdateValues>()

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
        {editing ? (
          <Flex gap={spacing.sm}>
            <Button onClick={onCancel} disabled={saving}>
              Hủy
            </Button>
            <Button type="primary" loading={saving} onClick={() => form.submit()}>
              Lưu thay đổi
            </Button>
          </Flex>
        ) : (
          <Button icon={<EditOutlined />} onClick={onEdit}>
            Chỉnh sửa
          </Button>
        )}
      </Flex>

      {editing ? (
        <>
          <Form<ProfileUpdateValues>
            form={form}
            layout="vertical"
            initialValues={{ fullName: profile.fullName, phone: profile.phone }}
            onFinish={onSave}
            disabled={saving}
            style={{ maxWidth: 560 }}
          >
            <Form.Item label="Họ và tên" name="fullName" rules={[{ max: 100, message: 'Họ và tên tối đa 100 ký tự.' }]}>
              <Input autoComplete="name" />
            </Form.Item>
            <Form.Item
              label="Số điện thoại (không bắt buộc)"
              name="phone"
              rules={[{ max: 20, message: 'Số điện thoại tối đa 20 ký tự.' }]}
            >
              <Input type="tel" autoComplete="tel" />
            </Form.Item>
          </Form>
          <Descriptions column={1} size="small" items={readOnlyItems} />
          <Typography.Paragraph style={{ margin: `${spacing.sm}px 0 0`, color: colors.textMuted }}>
            Email và vai trò không chỉnh sửa tại đây.
          </Typography.Paragraph>
        </>
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
