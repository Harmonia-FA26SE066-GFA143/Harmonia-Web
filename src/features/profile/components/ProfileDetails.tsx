import { Button, Flex, Input, Radio, Typography } from 'antd'
import { useEffect, useRef } from 'react'
import { roleLabels } from '@/shared/types/account'
import { spacing } from '@/styles/tokens'
import type { Profile, ProfileUpdateValues } from '../types'
import { CANCEL_LABEL, Form, Icon } from '@/shared/ui'
import { genderLabel, genderOptions, saintNameRules } from '@/shared/utils/personName'

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

  const rows = [
    { key: 'saintName', label: 'Tên thánh', value: profile.saintName },
    { key: 'fullName', label: 'Họ và tên', value: profile.fullName },
    { key: 'gender', label: 'Giới tính', value: genderLabel(profile.gender) },
    { key: 'phone', label: 'Số điện thoại', value: profile.phone },
    { key: 'email', label: 'Email', value: profile.email },
    { key: 'role', label: 'Vai trò', value: roleLabels[profile.role] },
  ]

  return (
    <section aria-labelledby="profile-info-heading" className="hm-sheet-section">
      <div className="hm-sheet-section__head hm-profile-head">
        <h2 id="profile-info-heading" className="hm-rubric">
          Thông tin cá nhân
        </h2>
        {!editing && (
          <Button ref={editButton} icon={<Icon name="edit" />} onClick={onEdit}>
            Chỉnh sửa
          </Button>
        )}
      </div>

      {editing ? (
        // Not `disabled` while saving (that would drop the focus of the field in use); the page ignores a second save.
        // The buttons are submit buttons inside the form, so Enter in a field saves too.
        <Form<ProfileUpdateValues>
          form={form}
          layout="vertical"
          // Every field here is optional (Harmonia-BE UpdateMyUserRequestValidator), so no marks at all.
          requiredMark={false}
          initialValues={{ fullName: profile.fullName, phone: profile.phone, saintName: profile.saintName, gender: profile.gender }}
          onFinish={onSave}
          className="hm-profile-form"
        >
          <div className="hm-profile-form__grid">
            <Form.Item label="Tên thánh" name="saintName" rules={saintNameRules}>
              {/* The first field in the DOM, so Tab goes on through every field from here. */}
              <Input autoComplete="off" placeholder="Ví dụ: Giuse" autoFocus />
            </Form.Item>
            <Form.Item label="Họ và tên" name="fullName" rules={[{ max: 100, message: 'Họ và tên tối đa 100 ký tự.' }]}>
              <Input autoComplete="name" placeholder="Ví dụ: Trần Minh Tâm" />
            </Form.Item>
            <Form.Item label="Giới tính" name="gender">
              <Radio.Group optionType="button" options={genderOptions} />
            </Form.Item>
            <Form.Item label="Số điện thoại" name="phone" rules={[{ max: 20, message: 'Số điện thoại tối đa 20 ký tự.' }]}>
              <Input type="tel" autoComplete="tel" placeholder="Ví dụ: 0901 234 567" />
            </Form.Item>
          </div>
          <Typography.Paragraph className="hm-profile-form__note">Email và vai trò không chỉnh sửa tại đây.</Typography.Paragraph>
          <Flex justify="flex-end" gap={spacing.sm}>
            <Button onClick={onCancel} disabled={saving}>
              {CANCEL_LABEL}
            </Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              Lưu thay đổi
            </Button>
          </Flex>
        </Form>
      ) : (
        <dl className="hm-profile-list">
          {rows.map(({ key, label, value }) => (
            <div key={key}>
              <dt>{label}</dt>
              <dd className={value ? undefined : 'is-empty'}>{value || 'Chưa cập nhật'}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}
