import { AutoComplete, Flex, Form, Input, Modal, Select } from 'antd'
import { useCatalogOptions } from '@/features/system-categories'
import { spacing } from '@/styles/tokens'
import type { SongDetail, SongValues } from '../types'

export interface SongFormModalProps {
  open: boolean
  /** Song being edited; absent when adding. */
  song?: Pick<SongDetail, 'title' | 'season' | 'massType' | 'ceremonyType' | 'theme' | 'vocalRequirements' | 'instrumentRequirements'>
  /** Values already used in the library, offered as suggestions for the free-text dimensions. */
  suggestions: { theme: string[]; vocalRequirements: string[]; instrumentRequirements: string[] }
  saving?: boolean
  onSubmit: (values: SongValues) => void
  onCancel: () => void
}

const toOptions = (values: string[]) => values.map((value) => ({ value }))
const clean = (value?: string) => value?.trim() || undefined

/**
 * Add/edit a song with the six FE-29 dimensions. Only the title is required: requiredness of the dimensions is
 * UNRESOLVED (FE-29), and their vocabularies are too, so theme and requirements are free text with suggestions.
 */
export function SongFormModal({ open, song, suggestions, saving = false, onSubmit, onCancel }: SongFormModalProps) {
  const seasons = useCatalogOptions('seasons')
  const massTypes = useCatalogOptions('massTypes')
  const ceremonyTypes = useCatalogOptions('ceremonyTypes')

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
            seasonId: song?.season?.id,
            massTypeId: song?.massType?.id,
            ceremonyTypeId: song?.ceremonyType?.id,
            theme: song?.theme,
            vocalRequirements: song?.vocalRequirements,
            instrumentRequirements: song?.instrumentRequirements,
          }}
          onFinish={(values) =>
            onSubmit({
              ...values,
              title: values.title.trim(),
              theme: clean(values.theme),
              vocalRequirements: clean(values.vocalRequirements),
              instrumentRequirements: clean(values.instrumentRequirements),
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
        rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập tên bài hát.' }]}
      >
        <Input placeholder="Ví dụ: Con Bước Lên Bàn Thờ" />
      </Form.Item>
      <Flex wrap gap={spacing.md}>
        <Form.Item label="Mùa phụng vụ" name="seasonId" style={{ flex: '1 1 180px' }}>
          <Select allowClear placeholder="Chọn mùa phụng vụ" options={seasons} />
        </Form.Item>
        <Form.Item label="Loại Thánh lễ" name="massTypeId" style={{ flex: '1 1 180px' }}>
          <Select allowClear placeholder="Chọn loại Thánh lễ" options={massTypes} />
        </Form.Item>
        <Form.Item label="Loại nghi thức" name="ceremonyTypeId" style={{ flex: '1 1 180px' }}>
          <Select allowClear placeholder="Chọn loại nghi thức" options={ceremonyTypes} />
        </Form.Item>
      </Flex>
      <Form.Item label="Chủ đề" name="theme">
        <AutoComplete options={toOptions(suggestions.theme)} placeholder="Ví dụ: Đức Mẹ" filterOption />
      </Form.Item>
      <Flex wrap gap={spacing.md}>
        <Form.Item label="Yêu cầu bè giọng" name="vocalRequirements" style={{ flex: '1 1 260px' }}>
          <AutoComplete
            options={toOptions(suggestions.vocalRequirements)}
            placeholder="Ví dụ: Soprano, Alto, Tenor, Bass"
            filterOption
          />
        </Form.Item>
        <Form.Item label="Yêu cầu nhạc cụ" name="instrumentRequirements" style={{ flex: '1 1 260px' }}>
          <AutoComplete options={toOptions(suggestions.instrumentRequirements)} placeholder="Ví dụ: Organ" filterOption />
        </Form.Item>
      </Flex>
    </Modal>
  )
}
