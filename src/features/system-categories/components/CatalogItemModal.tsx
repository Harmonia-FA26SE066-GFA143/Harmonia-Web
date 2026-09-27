import { Form, Input, Modal } from 'antd'
import type { CatalogItem, CatalogItemValues } from '../types'

export interface CatalogItemModalProps {
  open: boolean
  /** Entry being edited; absent when adding a new one. */
  item?: CatalogItem
  /** Modal titles, e.g. { create: 'Thêm kỹ năng', edit: 'Chỉnh sửa kỹ năng' }. */
  titles: { create: string; edit: string }
  nameLabel: string
  saving?: boolean
  onSubmit: (values: CatalogItemValues) => void
  onCancel: () => void
}

/**
 * Add/edit form for a catalog entry. Only the name is required; uniqueness and length limits are
 * backend rules not defined yet (TBD), so only a non-blank check is applied here.
 */
export function CatalogItemModal({
  open,
  item,
  titles,
  nameLabel,
  saving = false,
  onSubmit,
  onCancel,
}: CatalogItemModalProps) {
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
        <Form<CatalogItemValues>
          layout="vertical"
          initialValues={{ name: item?.name, description: item?.description }}
          onFinish={(values) =>
            onSubmit({ name: values.name.trim(), description: values.description?.trim() || undefined })
          }
          disabled={saving}
        >
          {dom}
        </Form>
      )}
    >
      <Form.Item
        label={nameLabel}
        name="name"
        rules={[{ required: true, whitespace: true, message: `Vui lòng nhập ${nameLabel.toLowerCase()}.` }]}
      >
        <Input autoFocus />
      </Form.Item>
      <Form.Item label="Mô tả (không bắt buộc)" name="description">
        <Input.TextArea rows={3} />
      </Form.Item>
    </Modal>
  )
}
