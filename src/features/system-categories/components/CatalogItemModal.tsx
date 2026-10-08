import { Form, Input, Modal, Switch } from 'antd'
import type { ReactNode } from 'react'
import type { CatalogEntry } from '../types'

export interface CatalogItemModalProps<T extends CatalogEntry, V> {
  open: boolean
  /** Entry being edited; absent when adding a new one. */
  item?: T
  /** Modal titles, e.g. { create: 'Thêm kỹ năng', edit: 'Chỉnh sửa kỹ năng' }. */
  titles: { create: string; edit: string }
  nameLabel: string
  /** Harmonia-BE validators: 50 for most catalogs, 100 for liturgical seasons. */
  nameMax: number
  /** Shown under the name, e.g. when the backend reports it is taken. */
  nameError?: string
  /** Fields after the name, e.g. the description or the season dates. */
  fields: ReactNode
  saving?: boolean
  onSubmit: (values: V) => void
  onCancel: () => void
}

/** Add/edit form of a catalog entry: name, the catalog's own fields, and whether the entry is in use. */
export function CatalogItemModal<T extends CatalogEntry, V extends { name: string }>({
  open,
  item,
  titles,
  nameLabel,
  nameMax,
  nameError,
  fields,
  saving = false,
  onSubmit,
  onCancel,
}: CatalogItemModalProps<T, V>) {
  return (
    <Modal
      open={open}
      title={item ? titles.edit : titles.create}
      okText={item ? 'Lưu thay đổi' : 'Thêm'}
      cancelText="Hủy"
      okButtonProps={{ htmlType: 'submit', loading: saving }}
      cancelButtonProps={{ disabled: saving }}
      onCancel={onCancel}
      mask={{ closable: !saving }}
      destroyOnHidden
      modalRender={(dom) => (
        // Unmounted on close (destroyOnHidden): each opening gets a fresh form store seeded from `item`.
        <Form<V>
          layout="vertical"
          initialValues={item ?? { isActive: true }}
          onFinish={(values) => onSubmit({ ...values, name: values.name.trim() })}
          disabled={saving}
        >
          {dom}
        </Form>
      )}
    >
      <Form.Item
        label={nameLabel}
        name="name"
        validateStatus={nameError ? 'error' : undefined}
        help={nameError}
        rules={[
          { required: true, whitespace: true, message: `Vui lòng nhập ${nameLabel.toLowerCase()}.` },
          { max: nameMax, message: `${nameLabel} tối đa ${nameMax} ký tự.` },
        ]}
      >
        <Input autoFocus />
      </Form.Item>
      {fields}
      <Form.Item
        label="Đang sử dụng"
        name="isActive"
        valuePropName="checked"
        extra="Mục ngừng dùng vẫn được giữ lại nhưng không còn hiện trong các danh sách chọn."
      >
        <Switch />
      </Form.Item>
    </Modal>
  )
}
