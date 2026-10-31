import { UploadOutlined } from '@ant-design/icons'
import { Alert, Button, Checkbox, Flex, Select, Typography, Upload } from 'antd'
import { useState } from 'react'
import { colors, spacing } from '@/styles/tokens'
import { materialFileProblem } from '../songErrors'
import {
  isMidiFile,
  materialExtensions,
  materialKindLabels,
  playbackInstrumentLabels,
  type PlaybackInstrument,
  type SongMaterial,
} from '../types'
import { FormDrawer } from '@/shared/ui'

export interface ReplaceMaterialFileDrawerProps {
  /** The drawer is open while a material is set. */
  material?: SongMaterial
  saving?: boolean
  /** `instrument` only for a MIDI file: the backend renders it again with that instrument. */
  onSubmit: (file: File, resetProgress: boolean, instrument?: PlaybackInstrument) => void
  onCancel: () => void
}

/**
 * Replaces the file of a material (`PUT /api/music-materials/{id}/file`): same kind, title, target skill and
 * assignments. What members marked ("đã học", "cần luyện thêm") is kept unless the content changed enough to clear it.
 */
export function ReplaceMaterialFileDrawer({ material, saving = false, onSubmit, onCancel }: Readonly<ReplaceMaterialFileDrawerProps>) {
  const [file, setFile] = useState<File>()
  const [resetProgress, setResetProgress] = useState(false)
  const [instrument, setInstrument] = useState<PlaybackInstrument>('piano')
  // Set when "Thay file" is pressed before a file is picked; the button stays clickable and says what is missing.
  const [missing, setMissing] = useState(false)
  const problem = material && file ? materialFileProblem(material.kind, file) : undefined
  const midi = Boolean(file && isMidiFile(file.name))

  const reset = () => {
    setFile(undefined)
    setResetProgress(false)
    setInstrument('piano')
    setMissing(false)
  }

  return (
    <FormDrawer
      open={Boolean(material)}
      title={material ? `Thay file: ${material.title}` : 'Thay file'}
      okText="Thay file"
      cancelText="Hủy"
      okButtonProps={{ loading: saving }}
      cancelButtonProps={{ disabled: saving }}
      onOk={() => {
        if (!file) setMissing(true)
        else if (!problem) onSubmit(file, resetProgress, midi ? instrument : undefined)
      }}
      onCancel={() => {
        reset()
        onCancel()
      }}
      afterClose={reset}
      destroyOnHidden
    >
      {material && (
        <Flex vertical gap={spacing.md}>
          <Typography.Text style={{ color: colors.textMuted }}>
            {materialKindLabels[material.kind]} · file hiện tại: {material.fileName ?? 'không có'}. Tên, loại, bè và các bài tập đang gắn tài liệu giữ nguyên.
          </Typography.Text>
          <Upload
            accept={materialExtensions[material.kind].join(',')}
            maxCount={1}
            showUploadList={false}
            beforeUpload={(picked) => {
              setFile(picked)
              setMissing(false)
              return false
            }}
          >
            <Button icon={<UploadOutlined />}>{file ? 'Chọn file khác' : 'Chọn file mới'}</Button>
          </Upload>
          {file && !problem && <Typography.Text>File mới: {file.name}</Typography.Text>}
          {problem && <Alert type="error" showIcon title={problem} />}
          {missing && <Alert type="error" showIcon title="Vui lòng chọn file mới." />}
          {midi && !problem && (
            <Flex vertical gap={spacing.xs}>
              <Typography.Text id="replace-instrument">Nhạc cụ phát trên ứng dụng di động</Typography.Text>
              <Select
                aria-labelledby="replace-instrument"
                value={instrument}
                onChange={setInstrument}
                options={Object.entries(playbackInstrumentLabels).map(([value, label]) => ({ value, label }))}
                style={{ maxWidth: 240 }}
              />
            </Flex>
          )}
          <Checkbox checked={resetProgress} onChange={(event) => setResetProgress(event.target.checked)}>
            Xoá tiến độ học của ca viên với tài liệu này (khi nội dung đã đổi nhiều)
          </Checkbox>
        </Flex>
      )}
    </FormDrawer>
  )
}
