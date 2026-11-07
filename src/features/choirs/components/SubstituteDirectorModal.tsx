import { App, Button, Input, Modal, Select, Typography } from 'antd'
import { useEffect } from 'react'
import { Form } from '@/shared/ui'
import { colors } from '@/styles/tokens'
import { choirErrorMessage } from '../choirErrors'
import { useChoirs, useSetSubstituteDirector } from '../hooks/useChoirs'
import type { EventChoir } from '../types'

interface Fields {
  directorId?: string
  reason?: string
}

const startValues = (choir: EventChoir): Fields => ({
  directorId: choir.substituteDirectorId,
  reason: choir.substituteDirectorId ? choir.reason : undefined,
})

export interface SubstituteDirectorModalProps {
  eventId: string
  /** The serving choir being edited; the modal is closed without one. */
  choir?: EventChoir
  onClose: () => void
}

/**
 * Parish Priest: another Choir Director stands in for a serving choir's director at this event only, e.g. when the
 * director is suddenly absent (`PUT …/choirs/{choirId}/substitute-director`, BE ff72860). Both keep the director's
 * rights at this event. The candidates are the directors of the parish's choirs (`GET /api/choirs`): the Priest has no
 * list of every Choir Director account, so one without a choir cannot be picked.
 */
export function SubstituteDirectorModal({ eventId, choir, onClose }: Readonly<SubstituteDirectorModalProps>) {
  const { message } = App.useApp()
  const [form] = Form.useForm<Fields>()
  const parish = useChoirs(Boolean(choir))
  const save = useSetSubstituteDirector(eventId)
  // The form store outlives the dialog and wins over `initialValues`, so every opening sets the opened choir's own
  // values explicitly (resetting alone would bring back the previous choir's initial values).
  useEffect(() => {
    if (!choir) return
    form.resetFields()
    form.setFieldsValue(startValues(choir))
  }, [choir, form])

  const directors = new Map<string, string>()
  for (const { directorId, directorName } of parish.data ?? []) {
    if (directorId && directorName && directorId !== choir?.directorId) directors.set(directorId, directorName)
  }
  const options = [...directors].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label, 'vi'))

  const submit = (directorId: string | null, reason?: string) =>
    choir &&
    save.mutate(
      { choirId: choir.choirId, directorId, reason },
      {
        onSuccess: () => {
          message.success(directorId ? 'Đã đặt ca trưởng thay thế.' : 'Đã gỡ ca trưởng thay thế.')
          onClose()
        },
        onError: (error) => message.error(choirErrorMessage(error, 'Không thể lưu ca trưởng thay thế. Vui lòng thử lại.')),
      },
    )

  return (
    <Modal
      open={Boolean(choir)}
      title={choir && `Ca trưởng thay thế · ${choir.name}`}
      destroyOnHidden
      onCancel={onClose}
      footer={[
        choir?.substituteDirectorId && (
          <Button key="clear" danger disabled={save.isPending} onClick={() => submit(null)}>
            Gỡ người thay
          </Button>
        ),
        <Button key="cancel" onClick={onClose} disabled={save.isPending}>
          Hủy
        </Button>,
        <Button key="save" type="primary" loading={save.isPending} onClick={() => form.submit()}>
          Lưu
        </Button>,
      ]}
    >
      {choir && (
        <Form<Fields>
          form={form}
          layout="vertical"
          initialValues={startValues(choir)}
          onFinish={({ directorId, reason }) => directorId && submit(directorId, reason?.trim())}
        >
          <Typography.Paragraph style={{ color: colors.textMuted }}>
            Chỉ áp dụng cho chương trình này. Người thay có quyền ca trưởng của ca đoàn ở chương trình này
            {choir.directorName ? `; ${choir.directorName} vẫn giữ quyền.` : '.'}
          </Typography.Paragraph>
          <Form.Item label="Ca trưởng thay thế" name="directorId" rules={[{ required: true, message: 'Chọn ca trưởng thay thế.' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Chọn ca trưởng"
              loading={parish.isPending}
              options={options}
              notFoundContent={parish.isError ? 'Không thể tải danh sách ca trưởng.' : 'Không có ca trưởng nào khác.'}
            />
          </Form.Item>
          <Form.Item
            label="Lý do"
            name="reason"
            rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập lý do.' }]}
            extra="Gửi kèm thông báo."
          >
            <Input.TextArea rows={2} maxLength={500} showCount placeholder="Ví dụ: ca trưởng bận đột xuất" />
          </Form.Item>
        </Form>
      )}
    </Modal>
  )
}
