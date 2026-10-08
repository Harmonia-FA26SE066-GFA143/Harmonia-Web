import { Form, Input, Modal, Select, Typography } from 'antd'
import { useCatalogOptions } from '@/features/system-categories'
import { materialKindLabels, type MaterialKind, type MaterialValues, type SongMaterial } from '../types'

export interface UploadMaterialModalProps {
  /** The file picked for this kind: the modal asks for the details before uploading. */
  pending?: { kind: MaterialKind; file: File }
  /** A material being edited (PUT /api/music-materials/{id}); used when no file is pending. */
  material?: SongMaterial
  saving?: boolean
  onSubmit: (values: MaterialValues) => void
  onCancel: () => void
}

/** File name without its extension, cut to the backend title limit, as a starting title. */
const titleFrom = (fileName: string) => fileName.replace(/\.[^.]+$/, '').slice(0, 200)

/**
 * Title (required by the backend) and optional target skill of a material, before it is uploaded or when it is
 * edited. The file and the kind cannot change: another file is a new material.
 */
export function UploadMaterialModal({ pending, material, saving = false, onSubmit, onCancel }: UploadMaterialModalProps) {
  const activeSkills = useCatalogOptions('skills')
  // A material may target a skill switched off since; keep it selectable so saving does not drop it silently.
  const skills =
    material?.targetSkillId && !activeSkills.some((skill) => skill.value === material.targetSkillId)
      ? [...activeSkills, { value: material.targetSkillId, label: material.targetSkillName ?? material.targetSkillId }]
      : activeSkills
  const editing = pending ? undefined : material

  return (
    <Modal
      open={Boolean(pending || material)}
      title={pending ? `Tải lên ${materialKindLabels[pending.kind].toLowerCase()}` : 'Sửa tài liệu'}
      okText={editing ? 'Lưu thay đổi' : 'Tải lên'}
      cancelText="Hủy"
      okButtonProps={{ htmlType: 'submit', loading: saving }}
      cancelButtonProps={{ disabled: saving }}
      onCancel={onCancel}
      mask={{ closable: !saving }}
      destroyOnHidden
      modalRender={(dom) => (
        <Form<MaterialValues>
          layout="vertical"
          disabled={saving}
          initialValues={
            editing
              ? { title: editing.title, targetSkillId: editing.targetSkillId ?? undefined }
              : { title: pending ? titleFrom(pending.file.name) : undefined }
          }
          onFinish={(values) => onSubmit({ title: values.title.trim(), targetSkillId: values.targetSkillId })}
        >
          {dom}
        </Form>
      )}
    >
      {(pending || editing) && (
        <Typography.Paragraph type="secondary" ellipsis={{ tooltip: pending?.file.name ?? editing?.fileName }}>
          Tệp: {pending?.file.name ?? editing?.fileName}
          {editing && ` (${materialKindLabels[editing.kind]}; muốn đổi tệp thì xoá rồi tải lên lại)`}
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
