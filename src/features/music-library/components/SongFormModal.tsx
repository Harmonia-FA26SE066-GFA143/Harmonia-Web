import { Flex, Form, Input, Modal } from 'antd'
import { spacing } from '@/styles/tokens'
import type { Song, SongValues } from '../types'

export interface SongFormModalProps {
  open: boolean
  /** Song being edited; absent when adding. */
  song?: Song
  saving?: boolean
  /** Shown under the title, e.g. when the backend reports a duplicate. */
  titleError?: string
  onSubmit: (values: SongValues) => void
  onCancel: () => void
}

const clean = (value?: string) => value?.trim() || undefined

/**
 * Add/edit the song fields of POST/PUT /api/songs. Only the title is required; maximum lengths follow the backend
 * validator. Classification is edited on the song page.
 */
export function SongFormModal({ open, song, saving = false, titleError, onSubmit, onCancel }: SongFormModalProps) {
  return (
    <Modal
      open={open}
      title={song ? 'Chỉnh sửa bài hát' : 'Thêm bài hát'}
      okText={song ? 'Lưu thay đổi' : 'Lưu bài hát'}
      cancelText="Hủy"
      okButtonProps={{ htmlType: 'submit', loading: saving }}
      cancelButtonProps={{ disabled: saving }}
      onCancel={onCancel}
      mask={{ closable: !saving }}
      width={640}
      destroyOnHidden
      modalRender={(dom) => (
        <Form<SongValues>
          layout="vertical"
          disabled={saving}
          initialValues={{
            title: song?.title,
            composer: song?.composer ?? undefined,
            lyricist: song?.lyricist ?? undefined,
            musicalKey: song?.musicalKey ?? undefined,
            tempo: song?.tempo ?? undefined,
            notes: song?.notes ?? undefined,
          }}
          onFinish={(values) =>
            onSubmit({
              title: values.title.trim(),
              composer: clean(values.composer),
              lyricist: clean(values.lyricist),
              musicalKey: clean(values.musicalKey),
              tempo: clean(values.tempo),
              notes: clean(values.notes),
            })
          }
        >
          {dom}
        </Form>
      )}
    >
      <Form.Item
        label="Tên bài hát"
        name="title"
        validateStatus={titleError ? 'error' : undefined}
        help={titleError}
        rules={[
          { required: true, whitespace: true, message: 'Vui lòng nhập tên bài hát.' },
          { max: 200, message: 'Tên bài hát tối đa 200 ký tự.' },
        ]}
      >
        <Input placeholder="Ví dụ: Con Bước Lên Bàn Thờ" />
      </Form.Item>
      <Flex wrap gap={spacing.md}>
        <Form.Item label="Nhạc sĩ" name="composer" rules={[{ max: 150, message: 'Tối đa 150 ký tự.' }]} style={{ flex: '1 1 260px' }}>
          <Input placeholder="Ví dụ: Lm. Kim Long" />
        </Form.Item>
        <Form.Item label="Người viết lời" name="lyricist" rules={[{ max: 150, message: 'Tối đa 150 ký tự.' }]} style={{ flex: '1 1 260px' }}>
          <Input />
        </Form.Item>
      </Flex>
      <Flex wrap gap={spacing.md}>
        <Form.Item label="Giọng (tone)" name="musicalKey" rules={[{ max: 10, message: 'Tối đa 10 ký tự.' }]} style={{ flex: '1 1 180px' }}>
          <Input placeholder="Ví dụ: Rê trưởng" />
        </Form.Item>
        <Form.Item label="Nhịp độ" name="tempo" rules={[{ max: 50, message: 'Tối đa 50 ký tự.' }]} style={{ flex: '1 1 180px' }}>
          <Input placeholder="Ví dụ: Andante" />
        </Form.Item>
      </Flex>
      <Form.Item label="Ghi chú" name="notes" rules={[{ max: 1000, message: 'Tối đa 1000 ký tự.' }]}>
        <Input.TextArea rows={3} showCount maxLength={1000} />
      </Form.Item>
    </Modal>
  )
}
