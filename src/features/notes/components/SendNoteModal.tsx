import { DatePicker, Form, Input, Modal, Select } from 'antd'
import dayjs from 'dayjs'
import { useEventNames, useEvents, vietnamToday } from '@/features/liturgical-programs'
import { dateOnlyFieldProps } from '@/shared/utils/dateField'
import { useNoteRecipients } from '../hooks/useNotes'
import type { DirectorNoteValues } from '../types'

export interface SendNoteModalProps {
  open: boolean
  saving?: boolean
  onSubmit: (values: DirectorNoteValues) => void
  onCancel: () => void
}

/** Rendered only while the modal is open, so recipients and events load when they are needed. */
function NoteFields() {
  const recipients = useNoteRecipients()
  // ponytail: the first 100 events from today; a note about an older or later event would need a searchable select.
  const events = useEvents({ fromDate: vietnamToday() }, { pageNumber: 1, pageSize: 100 })
  const { eventName } = useEventNames()

  return (
    <>
      <Form.Item label="Gửi đến" name="toUserIds" rules={[{ required: true, message: 'Chọn ít nhất một Ca trưởng.' }]}>
        <Select
          mode="multiple"
          showSearch
          optionFilterProp="label"
          placeholder="Chọn Ca trưởng"
          loading={recipients.isPending}
          notFoundContent={recipients.isSuccess ? 'Chưa có Ca trưởng nào đang hoạt động.' : undefined}
          options={(recipients.data ?? []).map(({ id, fullName, email }) => ({ value: id, label: fullName || email }))}
        />
      </Form.Item>
      <Form.Item label="Ngày" name="noteDate" extra="Chọn ngày, sự kiện hoặc cả hai." {...dateOnlyFieldProps}>
        <DatePicker format="DD/MM/YYYY" placeholder="Chọn ngày" style={{ width: '100%', maxWidth: 220 }} />
      </Form.Item>
      <Form.Item
        label="Sự kiện"
        name="eventId"
        dependencies={['noteDate']}
        rules={[
          ({ getFieldValue }) => ({
            validator: (_, value?: string) =>
              value || getFieldValue('noteDate')
                ? Promise.resolve()
                : Promise.reject(new Error('Chọn ngày hoặc sự kiện cho ghi chú.')),
          }),
        ]}
      >
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Các sự kiện từ hôm nay"
          loading={events.isPending}
          options={(events.data?.items ?? [])
            .filter((event) => event.status !== 'cancelled')
            .map((event) => ({
              value: event.id,
              label: `${eventName(event)} · ${dayjs(`${event.date}T${event.time}`).format('DD/MM/YYYY HH:mm')}`,
            }))}
        />
      </Form.Item>
      <Form.Item
        label="Nội dung"
        name="content"
        rules={[
          { required: true, whitespace: true, message: 'Vui lòng nhập nội dung ghi chú.' },
          { max: 2000, message: 'Nội dung tối đa 2000 ký tự.' },
        ]}
      >
        <Input.TextArea rows={5} showCount maxLength={2000} />
      </Form.Item>
    </>
  )
}

/**
 * Parish Priest: a note or request to Choir Directors (FE-23; Harmonia-BE CreateDirectorNoteRequestValidator). Each
 * chosen Choir Director gets their own copy and a notification.
 */
export function SendNoteModal({ open, saving = false, onSubmit, onCancel }: SendNoteModalProps) {
  return (
    <Modal
      open={open}
      title="Gửi ghi chú cho Ca trưởng"
      okText="Gửi ghi chú"
      cancelText="Hủy"
      okButtonProps={{ htmlType: 'submit', loading: saving }}
      cancelButtonProps={{ disabled: saving }}
      onCancel={onCancel}
      mask={{ closable: !saving }}
      destroyOnHidden
      modalRender={(dom) => (
        <Form<DirectorNoteValues>
          layout="vertical"
          disabled={saving}
          onFinish={(values) => onSubmit({ ...values, content: values.content.trim() })}
        >
          {dom}
        </Form>
      )}
    >
      <NoteFields />
    </Modal>
  )
}
