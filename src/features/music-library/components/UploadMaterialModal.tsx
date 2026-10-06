import { Form, Input, Modal, Select, Typography } from 'antd'
import { useCatalogOptions } from '@/features/system-categories'
import { materialKindLabels, type MaterialKind } from '../types'

export interface UploadMaterialModalProps {
  /** The file picked for this kind; the modal is open while one is set. */
  pending?: { kind: MaterialKind; file: File }
  saving?: boolean
  onSubmit: (values: { title: string; targetSkillId?: string }) => void
  onCancel: () => void
}

/** File name without its extension, cut to the backend title limit, as a starting title. */
const titleFrom = (fileName: string) => fileName.replace(/\.[^.]+$/, '').slice(0, 200)

/** Title (required by the backend) and optional target skill of a material before it is uploaded. */
export function UploadMaterialModal({ pending, saving = false, onSubmit, onCancel }: UploadMaterialModalProps) {
  const skills = useCatalogOptions('skills')

  return (
    <Modal
      open={Boolean(pending)}
      title={pending ? `Tải lên ${materialKindLabels[pending.kind].toLowerCase()}` : undefined}
      okText="Tải lên"
      cancelText="Hủy"
      okButtonProps={{ htmlType: 'submit', loading: saving }}
      cancelButtonProps={{ disabled: saving }}
      onCancel={onCancel}
      mask={{ closable: !saving }}
      destroyOnHidden
      modalRender={(dom) => (
        <Form<{ title: string; targetSkillId?: string }>
          layout="vertical"
          disabled={saving}
          initialValues={{ title: pending ? titleFrom(pending.file.name) : undefined }}
          onFinish={(values) => onSubmit({ title: values.title.trim(), targetSkillId: values.targetSkillId })}
        >
          {dom}
        </Form>
      )}
    >
      {pending && (
        <Typography.Paragraph type="secondary" ellipsis={{ tooltip: pending.file.name }}>
          Tệp: {pending.file.name}
        </Typography.Paragraph>
      )}
      <Form.Item
        label="Tiêu đề"
        name="title"
        rules={[
          { required: true, whitespace: true, message: 'Vui lòng nhập tiêu đề tài liệu.' },
          { max: 200, message: 'Tiêu đề tối đa 200 ký tự.' },
        ]}
      >
        <Input placeholder="Ví dụ: Audio mẫu bè Tenor" />
      </Form.Item>
      <Form.Item
        label="Dành cho kỹ năng"
        name="targetSkillId"
        extra="Để trống nếu tài liệu dành cho cả ca đoàn."
      >
        <Select allowClear showSearch optionFilterProp="label" placeholder="Cả ca đoàn" options={skills} />
      </Form.Item>
    </Modal>
  )
}
