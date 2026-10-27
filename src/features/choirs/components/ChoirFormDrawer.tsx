import { Input, Select, Switch } from 'antd'
import type { Choir, ChoirValues } from '../types'
import { Form, FormDrawer } from '@/shared/ui'

export interface ChoirFormDrawerProps {
  open: boolean
  /** The choir being edited; absent when adding one. */
  choir?: Choir
  /** Shown under the name when the backend reports it is taken. */
  nameError?: string
  saving?: boolean
  /** Active Choir Director accounts (Admin); the choir's current director is offered even if switched off since. */
  directors: { value: string; label: string }[]
  directorsLoading?: boolean
  onSubmit: (values: ChoirValues) => void
  onCancel: () => void
}

/**
 * Admin: add or edit a choir (CreateChoirRequestValidator, UpdateChoirRequestValidator): name ≤ 100, unique across
 * choirs; description ≤ 500; the Choir Director in charge (D8), optional. A new choir is always active; switching one
 * off is an edit.
 */
export function ChoirFormDrawer({
  open,
  choir,
  nameError,
  saving = false,
  directors,
  directorsLoading = false,
  onSubmit,
  onCancel,
}: Readonly<ChoirFormDrawerProps>) {
  const current = choir?.directorId
  const directorOptions =
    current && !directors.some(({ value }) => value === current)
      ? [...directors, { value: current, label: `${choir?.directorName ?? 'Ca trưởng hiện tại'} (ngừng hoạt động)` }]
      : directors

  return (
    <FormDrawer
      open={open}
      title={choir ? 'Chỉnh sửa ca đoàn' : 'Thêm ca đoàn'}
      okText={choir ? 'Lưu thay đổi' : 'Thêm'}
      cancelText="Hủy"
      okButtonProps={{ htmlType: 'submit', loading: saving }}
      cancelButtonProps={{ disabled: saving }}
      onCancel={onCancel}
      destroyOnHidden
      drawerRender={(dom) => (
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
      <Form.Item
        label="Ca trưởng phụ trách"
        name="directorId"
        extra="Ca trưởng chỉ thấy và quản lý ca đoàn mình phụ trách. Để trống nếu chưa có."
      >
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Chưa có ca trưởng"
          loading={directorsLoading}
          options={directorOptions}
        />
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
    </FormDrawer>
  )
}
