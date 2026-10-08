import { DatePicker, Flex, Form, Input, Modal, Select, Typography } from 'antd'
import type { Dayjs } from 'dayjs'
import { vietnamToday } from '@/lib/api/dates'
import { dateOnlyFieldProps } from '@/shared/utils/dateField'
import { spacing } from '@/styles/tokens'
import { memberStatuses, memberStatusLabels, type MemberProfile, type MemberProfileValues } from '../types'

export interface MemberFormModalProps {
  /** The member being edited; the modal is closed without one. */
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
 * The Choir Director edits what the member record holds: phone, birth date, joining date and status. Name and email
 * belong to the account (the member or the Admin edits them), so they are shown read-only.
 */
export function MemberFormModal({ member, saving = false, onSubmit, onCancel }: MemberFormModalProps) {
  return (
    <Modal
      open={Boolean(member)}
      title="Sửa thông tin ca viên"
      okText="Lưu thay đổi"
      cancelText="Hủy"
      okButtonProps={{ htmlType: 'submit', loading: saving }}
      cancelButtonProps={{ disabled: saving }}
      onCancel={onCancel}
      mask={{ closable: !saving }}
      destroyOnHidden
      modalRender={(dom) => (
        <Form<MemberProfileValues>
          layout="vertical"
          disabled={saving}
          initialValues={
            member && {
              phone: member.phone ?? undefined,
              dateOfBirth: member.dateOfBirth ?? undefined,
              joinedDate: member.joinedDate,
              status: member.status,
            }
          }
          onFinish={(values) => onSubmit({ ...values, phone: values.phone?.trim() || undefined })}
        >
          {dom}
        </Form>
      )}
    >
      {member && (
        <Typography.Paragraph>
          <Typography.Text strong>{member.fullName}</Typography.Text> · {member.email}
        </Typography.Paragraph>
      )}
      <Form.Item label="Số điện thoại (không bắt buộc)" name="phone" rules={[{ max: 20, message: 'Số điện thoại tối đa 20 ký tự.' }]}>
        <Input type="tel" autoComplete="off" />
      </Form.Item>
      <Flex gap={spacing.md} wrap>
        <Form.Item
          label="Ngày sinh (không bắt buộc)"
          name="dateOfBirth"
          {...dateOnlyFieldProps}
          rules={[notAfterToday('Ngày sinh không được sau hôm nay.')]}
          style={{ flex: '1 1 180px' }}
        >
          <DatePicker format="DD/MM/YYYY" placeholder="Chọn ngày" disabledDate={afterToday} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          label="Ngày tham gia"
          name="joinedDate"
          {...dateOnlyFieldProps}
          rules={[
            { required: true, message: 'Vui lòng chọn ngày tham gia.' },
            notAfterToday('Ngày tham gia không được sau hôm nay.'),
          ]}
          style={{ flex: '1 1 180px' }}
        >
          <DatePicker format="DD/MM/YYYY" placeholder="Chọn ngày" disabledDate={afterToday} style={{ width: '100%' }} />
        </Form.Item>
      </Flex>
      <Form.Item label="Trạng thái" name="status" rules={[{ required: true, message: 'Vui lòng chọn trạng thái.' }]}>
        <Select options={memberStatuses.map((status) => ({ value: status, label: memberStatusLabels[status] }))} />
      </Form.Item>
    </Modal>
  )
}
