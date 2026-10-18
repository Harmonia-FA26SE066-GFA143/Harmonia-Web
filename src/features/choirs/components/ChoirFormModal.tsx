import { Form, Input, Modal, Switch } from 'antd'
import type { Choir, ChoirValues } from '../types'

export interface ChoirFormModalProps {
  open: boolean
  /** The choir being edited; absent when adding one. */
  choir?: Choir
  /** Shown under the name when the backend reports it is taken. */
  nameError?: string
  saving?: boolean
  onSubmit: (values: ChoirValues) => void
  onCancel: () => void
}

/**
 * Add or edit a choir (CreateChoirRequestValidator, UpdateChoirRequestValidator): name ≤ 100, unique across choirs;
 * description ≤ 500. A new choir is always active; switching one off is an edit.
 */
export function ChoirFormModal({ open, choir, nameError, saving = false, onSubmit, onCancel }: Readonly<ChoirFormModalProps>) {
  return (
    <Modal
      open={open}
      title={choir ? 'Chỉnh sửa ca đoàn' : 'Thêm ca đoàn'}
      okText={choir ? 'Lưu thay đổi' : 'Thêm'}
      cancelText="Hủy"
      okButtonProps={{ htmlType: 'submit', loading: saving }}
      cancelButtonProps={{ disabled: saving }}
      onCancel={onCancel}
      mask={{ closable: !saving }}
      destroyOnHidden
      modalRender={(dom) => (
        <Form<ChoirValues>
          layout="vertical"
          initialValues={choir ?? { isActive: true }}
          onFinish={(values) => onSubmit({ ...values, name: values.name.trim(), isActive: values.isActive ?? true })}
        >
          {dom}
        </Form>
      )}
    >
      <Form.Item
        label="Tên ca đoàn"
        name="name"
        validateStatus={nameError ? 'error' : undefined}
        help={nameError}
        rules={[
          { required: true, whitespace: true, message: 'Vui lòng nhập tên ca đoàn.' },
          { max: 100, message: 'Tên ca đoàn tối đa 100 ký tự.' },
        ]}
      >
        <Input autoFocus />
      </Form.Item>
      <Form.Item label="Mô tả (không bắt buộc)" name="description" rules={[{ max: 500, message: 'Mô tả tối đa 500 ký tự.' }]}>
        <Input.TextArea rows={3} showCount maxLength={500} />
      </Form.Item>
      {choir && (
        <Form.Item
          label="Đang hoạt động"
          name="isActive"
          valuePropName="checked"
          extra="Ca đoàn ngừng hoạt động vẫn giữ ca viên và các sự kiện đã gán, nhưng không nhận thêm."
        >
          <Switch />
        </Form.Item>
      )}
    </Modal>
  )
}
