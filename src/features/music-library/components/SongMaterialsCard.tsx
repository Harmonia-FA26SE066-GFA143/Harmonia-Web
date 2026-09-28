import {
  CustomerServiceOutlined,
  DeleteOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  ReadOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import { Button, Card, Divider, Flex, Tooltip, Typography, Upload } from 'antd'
import dayjs from 'dayjs'
import { Fragment, type ComponentType } from 'react'
import { colors, radius, spacing, typography } from '@/styles/tokens'
import { materialKindLabels, materialKinds, type MaterialKind, type SongMaterial } from '../types'

export interface SongMaterialsCardProps {
  materials: SongMaterial[]
  /** Kind currently being uploaded, to show progress on its button. */
  uploadingKind?: MaterialKind
  onUpload: (kind: MaterialKind, file: File) => void
  onDelete: (material: SongMaterial) => void
}

const kindIcons: Record<MaterialKind, ComponentType> = {
  sheetMusic: ReadOutlined,
  lyrics: FileTextOutlined,
  sampleAudio: CustomerServiceOutlined,
  rehearsalMaterial: FolderOpenOutlined,
}

function UploadButton({ kind, loading, label, onUpload }: {
  kind: MaterialKind
  loading: boolean
  label: string
  onUpload: (kind: MaterialKind, file: File) => void
}) {
  // No format or size restriction: both are TBD (FE-28).
  return (
    <Upload
      showUploadList={false}
      beforeUpload={(file) => {
        onUpload(kind, file)
        return false
      }}
    >
      <Button icon={<UploadOutlined />} loading={loading} aria-label={`${label}: ${materialKindLabels[kind]}`}>
        {label}
      </Button>
    </Upload>
  )
}

function MaterialRow({ material, onDelete }: { material: SongMaterial; onDelete: (material: SongMaterial) => void }) {
  const Icon = kindIcons[material.kind]
  return (
    <Flex
      component="li"
      wrap
      align="center"
      gap={spacing.md}
      style={{ padding: spacing.md, background: colors.background, borderRadius: radius.md }}
    >
      <span aria-hidden style={{ color: colors.primary, fontSize: 20 }}>
        <Icon />
      </span>
      <Flex vertical style={{ flex: '1 1 200px', minWidth: 0 }}>
        <Typography.Text strong ellipsis={{ tooltip: material.fileName }}>
          {material.fileName}
        </Typography.Text>
        <Typography.Text style={{ color: colors.textMuted, fontSize: typography.metadata.fontSize }}>
          Tải lên {dayjs(material.uploadedAt).format('DD/MM/YYYY')}
        </Typography.Text>
      </Flex>
      {material.kind === 'sampleAudio' && material.url && (
        <audio controls preload="none" src={material.url} aria-label={`Nghe ${material.fileName}`} style={{ height: 36 }} />
      )}
      {material.url ? (
        <Button type="link" href={material.url} target="_blank" rel="noopener noreferrer" download={material.fileName}>
          Xem/Tải xuống
        </Button>
      ) : (
        <Tooltip title="Chưa có đường dẫn tệp (chờ API)">
          <Button type="link" disabled>
            Xem/Tải xuống
          </Button>
        </Tooltip>
      )}
      <Button
        type="text"
        danger
        icon={<DeleteOutlined />}
        onClick={() => onDelete(material)}
        aria-label={`Xoá ${material.fileName}`}
      />
    </Flex>
  )
}

/** Materials grouped by the four FE-08/FE-28 kinds, each with its own upload action. */
export function SongMaterialsCard({ materials, uploadingKind, onUpload, onDelete }: SongMaterialsCardProps) {
  return (
    <Card title="Tài liệu">
      {materialKinds.map((kind, index) => {
        const items = materials.filter((material) => material.kind === kind)
        const headingId = `materials-${kind}`
        return (
          <Fragment key={kind}>
            {index > 0 && <Divider />}
            <section aria-labelledby={headingId}>
              <Flex align="center" justify="space-between" gap={spacing.sm} style={{ marginBottom: spacing.sm }}>
                <Typography.Title id={headingId} level={3} style={{ margin: 0 }}>
                  {materialKindLabels[kind]}
                </Typography.Title>
                <UploadButton kind={kind} label="Tải lên" loading={uploadingKind === kind} onUpload={onUpload} />
              </Flex>
              {items.length > 0 ? (
                <Flex component="ul" vertical gap={spacing.sm} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {items.map((material) => (
                    <MaterialRow key={material.id} material={material} onDelete={onDelete} />
                  ))}
                </Flex>
              ) : (
                <Flex
                  align="center"
                  justify="center"
                  gap={spacing.sm}
                  wrap
                  style={{
                    padding: spacing.lg,
                    border: `1px dashed ${colors.mutedBorder}`,
                    borderRadius: radius.md,
                    color: colors.textMuted,
                  }}
                >
                  Chưa có tài liệu
                </Flex>
              )}
            </section>
          </Fragment>
        )
      })}
    </Card>
  )
}
