import { Alert, DatePicker, Input, Radio, Select, Typography, type InputRef } from 'antd'
import type { Dayjs } from 'dayjs'
import { useRef } from 'react'
import { vietnamToday } from '@/lib/api/dates'
import { dateOnlyFieldProps } from '@/shared/utils/dateField'
import { colors, component, spacing } from '@/styles/tokens'
import { memberStatuses, memberStatusLabels, type MemberProfile, type MemberProfileValues } from '../types'
import { CANCEL_LABEL, EDIT_MEMBER_ACTION, Form, FormDrawer, SELECT_POPUP_PROPS } from '@/shared/ui'
import { genderOptions, personName, saintNameRules } from '@/shared/utils/personName'
import { VoicePartTags } from './SkillTags'

export interface MemberFormDrawerProps {
  /** The member being edited; the drawer is closed without one. */
  member?: MemberProfile
  saving?: boolean
  onSubmit: (values: MemberProfileValues) => void
  onCancel: () => void
}

// The backend compares both dates with today in Vietnam (UpdateMemberProfileRequestValidator).
const afterToday = (date: Dayjs) => date.format('YYYY-MM-DD') > vietnamToday()

const notAfterToday = (message: string) => ({
  validator: (_: unknown, value?: string) =>
    !value || value <= vietnamToday() ? Promise.resolve() : Promise.reject(new Error(message)),
})

/**
 * The Choir Director edits what the member record holds: phone, saint name, birth date, joining date and status. Name and email
 * belong to the account (the member or the Admin edits them), so they are shown read-only.
 */
export function MemberFormDrawer({ member, saving = false, onSubmit, onCancel }: Readonly<MemberFormDrawerProps>) {
  const firstField = useRef<InputRef>(null)
  return (
    <FormDrawer
      open={Boolean(member)}
      title={EDIT_MEMBER_ACTION}
      size={component.drawer.md}
      okText="Lưu thay đổi"
      cancelText={CANCEL_LABEL}
      initialFocusRef={firstField}
      okButtonProps={{ htmlType: 'submit', loading: saving }}
      cancelButtonProps={{ disabled: saving }}
      onCancel={onCancel}
      destroyOnHidden
      drawerRender={(dom) => (
        <Form<MemberProfileValues>
          layout="vertical"
          initialValues={
            member && {
              phone: member.phone ?? undefined,
              saintName: member.saintName ?? undefined,
              gender: member.gender ?? undefined,
              dateOfBirth: member.dateOfBirth ?? undefined,
              joinedDate: member.joinedDate,
              status: member.status,
            }
          }
          onFinish={(values) =>
            onSubmit({ ...values, phone: values.phone?.trim() || undefined, saintName: values.saintName?.trim() || undefined })
          }
        >
          {dom}
        </Form>
      )}
    >
      {member && (
        <section aria-label="Thông tin chỉ xem" className="hm-form-context">
          <dl className="hm-facts">
            <dt>Họ tên</dt>
            <dd>{personName(member.fullName, member.saintName)}</dd>
            <dt>Email</dt>
            <dd>{member.email}</dd>
            <dt>Bè (từ kỹ năng đã duyệt)</dt>
            <dd>
              <VoicePartTags skills={member.skills} voiceOnly showUnassigned />
            </dd>
          </dl>
          <Typography.Paragraph style={{ margin: `${spacing.sm}px 0 0`, color: colors.textMuted }}>
            Họ tên và email thuộc tài khoản (do Ca viên hoặc Quản trị viên cập nhật). Bè được xác định tự động từ kỹ năng
            đã duyệt.
          </Typography.Paragraph>
        </section>
      )}
      <div className="hm-form-row-2">
        <Form.Item label="Tên thánh" name="saintName" rules={saintNameRules}>
          <Input ref={firstField} autoComplete="off" placeholder="Ví dụ: Giuse" />
        </Form.Item>
        <Form.Item label="Giới tính" name="gender">
          <Radio.Group optionType="button" options={genderOptions} />
        </Form.Item>
      </div>
      <div className="hm-form-row-2">
        <Form.Item label="Số điện thoại" name="phone" rules={[{ max: 20, message: 'Số điện thoại tối đa 20 ký tự.' }]}>
          <Input type="tel" autoComplete="off" placeholder="Ví dụ: 0901 234 567" />
        </Form.Item>
        <Form.Item label="Trạng thái" name="status" rules={[{ required: true, message: 'Vui lòng chọn trạng thái.' }]}>
          <Select {...SELECT_POPUP_PROPS} options={memberStatuses.map((status) => ({ value: status, label: memberStatusLabels[status] }))} />
        </Form.Item>
      </div>
      <div className="hm-form-row-2">
        <Form.Item
          label="Ngày sinh"
          name="dateOfBirth"
          {...dateOnlyFieldProps}
          rules={[notAfterToday('Ngày sinh không được sau hôm nay.')]}
        >
          <DatePicker {...SELECT_POPUP_PROPS} format="DD/MM/YYYY" placeholder="Chọn ngày" disabledDate={afterToday} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          label="Ngày tham gia"
          name="joinedDate"
          {...dateOnlyFieldProps}
          rules={[
            { required: true, message: 'Vui lòng chọn ngày tham gia.' },
            notAfterToday('Ngày tham gia không được sau hôm nay.'),
          ]}
        >
          <DatePicker {...SELECT_POPUP_PROPS} format="DD/MM/YYYY" placeholder="Chọn ngày" disabledDate={afterToday} style={{ width: '100%' }} />
        </Form.Item>
      </div>
      {/* Stopping service has effects since BE origin/main 1040339 (MemberProfileService.UpdateAsync →
          ChoirService.DropMemberFromUpcomingEventsAsync): said before the save, not discovered after. */}
      <Form.Item noStyle shouldUpdate={(before, after) => before.status !== after.status}>
        {({ getFieldValue }) =>
          member?.status === 'active' && getFieldValue('status') !== 'active' ? (
            <Alert
              type="warning"
              showIcon
              title="Ca viên sẽ được gỡ khỏi xác nhận tham gia và phân công của các lễ sắp tới. Phân công đã chốt sẽ mở lại để xếp người thay, Ca trưởng phụ trách lễ nhận thông báo."
            />
          ) : null
        }
      </Form.Item>
    </FormDrawer>
  )
}
