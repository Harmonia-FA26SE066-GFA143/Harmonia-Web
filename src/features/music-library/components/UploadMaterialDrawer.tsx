import { Input, Select, Typography } from 'antd'
import { useCatalogOptions } from '@/features/system-categories'
import {
  isMidiFile,
  materialKindLabels,
  maxLyricsTextLength,
  playbackInstrumentLabels,
  type MaterialKind,
  type PlaybackInstrument,
  type SongMaterial,
} from '../types'
import { Form, FormDrawer } from '@/shared/ui'

/** A material about to be added: a picked file, or typed lyrics (`lyricsText`, possibly drafted by AI). */
export interface PendingMaterial {
  kind: MaterialKind
  file?: File
  lyricsText?: string
  /** Starting title; a file name gives one otherwise. */
  title?: string
}

export interface MaterialFormValues {
  title: string
  targetSkillId?: string
  lyricsText?: string
  instrument?: PlaybackInstrument
}

export interface UploadMaterialDrawerProps {
  /** The material to add: the drawer asks for the details before uploading. */
  pending?: PendingMaterial
  /** A material being edited (PUT /api/music-materials/{id}); used when nothing is pending. */
  material?: SongMaterial
  saving?: boolean
  onSubmit: (values: MaterialFormValues) => void
  onCancel: () => void
}

/** File name without its extension, cut to the backend title limit, as a starting title. */
const titleFrom = (fileName: string) => fileName.replace(/\.[^.]+$/, '').slice(0, 200)

const instrumentOptions = Object.entries(playbackInstrumentLabels).map(([value, label]) => ({ value, label }))

/**
 * Title (required by the backend) and optional target skill of a material, before it is uploaded or when it is
 * edited. The file and the kind cannot change: another file is a new material. Typed lyrics (BE d394db4) carry their
 * text here, both when added and when edited; a MIDI file asks which instrument the mobile app plays it with.
 */
export function UploadMaterialDrawer({ pending, material, saving = false, onSubmit, onCancel }: Readonly<UploadMaterialDrawerProps>) {
  const activeSkills = useCatalogOptions('skills')
  // A material may target a skill switched off since; keep it selectable so saving does not drop it silently.
  const skills =
    material?.targetSkillId && !activeSkills.some((skill) => skill.value === material.targetSkillId)
      ? [...activeSkills, { value: material.targetSkillId, label: material.targetSkillName ?? material.targetSkillId }]
      : activeSkills
  const editing = pending ? undefined : material
  const typedLyrics = pending ? pending.kind === 'lyrics' && !pending.file : editing?.lyricsText != null
  const fileName = pending?.file?.name ?? editing?.fileName ?? undefined
  const midi = Boolean(pending?.file && isMidiFile(pending.file.name))

  const title = () => {
    if (editing) return typedLyrics ? 'Sửa lời bài hát' : 'Sửa tài liệu'
    if (!pending) return ''
    return typedLyrics ? 'Thêm lời bài hát' : `Tải lên ${materialKindLabels[pending.kind].toLowerCase()}`
  }
  const okText = () => {
    if (editing) return 'Lưu thay đổi'
    return typedLyrics ? 'Lưu lời bài hát' : 'Tải lên'
  }

  return (
    <FormDrawer
      open={Boolean(pending || material)}
      title={title()}
      okText={okText()}
      cancelText="Hủy"
      okButtonProps={{ htmlType: 'submit', loading: saving }}
      cancelButtonProps={{ disabled: saving }}
      onCancel={onCancel}
      size={typedLyrics ? 640 : undefined}
      destroyOnHidden
      drawerRender={(dom) => (
        <Form<MaterialFormValues>
          layout="vertical"
          initialValues={
            editing
              ? { title: editing.title, targetSkillId: editing.targetSkillId ?? undefined, lyricsText: editing.lyricsText ?? undefined }
              : {
                  title: pending?.title ?? (pending?.file ? titleFrom(pending.file.name) : undefined),
                  lyricsText: pending?.lyricsText,
                  instrument: midi ? 'piano' : undefined,
                }
          }
          onFinish={(values) =>
            onSubmit({
              title: values.title.trim(),
              targetSkillId: values.targetSkillId,
              lyricsText: typedLyrics ? values.lyricsText?.trim() : undefined,
              instrument: midi ? values.instrument : undefined,
            })
          }
        >
          {dom}
        </Form>
      )}
    >
      {fileName && (
        <Typography.Paragraph type="secondary" ellipsis={{ tooltip: fileName }}>
          Tệp: {fileName}
          {editing && ` (${materialKindLabels[editing.kind]}; muốn đổi tệp thì dùng nút Thay file)`}
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
      {typedLyrics && (
        <Form.Item
          label="Lời bài hát"
          name="lyricsText"
          extra={pending?.lyricsText ? 'Bản nháp do AI đọc từ bản nhạc. Hãy soát lại trước khi lưu.' : undefined}
          rules={[
            { required: true, whitespace: true, message: 'Vui lòng nhập lời bài hát.' },
            { max: maxLyricsTextLength, message: `Lời bài hát tối đa ${maxLyricsTextLength.toLocaleString('vi-VN')} ký tự.` },
          ]}
        >
          <Input.TextArea autoSize={{ minRows: 10, maxRows: 24 }} placeholder="Gõ hoặc dán lời bài hát, mỗi câu một dòng" />
        </Form.Item>
      )}
      {midi && (
        <Form.Item label="Nhạc cụ phát" name="instrument" extra="Ứng dụng di động phát tệp MIDI bằng nhạc cụ này. Trình duyệt không phát được MIDI, Web chỉ cho tải về.">
          <Select options={instrumentOptions} />
        </Form.Item>
      )}
      <Form.Item
        label="Dành cho kỹ năng"
        name="targetSkillId"
        extra="Để trống nếu tài liệu dành cho cả ca đoàn."
      >
        <Select allowClear showSearch optionFilterProp="label" placeholder="Cả ca đoàn" options={skills} />
      </Form.Item>
    </FormDrawer>
  )
}
