import {
  BarChartOutlined,
  CustomerServiceOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  ReadOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import { Button, Card, Divider, Flex, Tag, Typography, Upload } from 'antd'
import dayjs from 'dayjs'
import { Fragment, type ComponentType } from 'react'
import { parseUtc } from '@/lib/api/dates'
import { colors, radius, spacing, typography } from '@/styles/tokens'
import { materialExtensions, materialKindLabels, materialKinds, type MaterialKind, type SongMaterial } from '../types'

export interface SongMaterialsCardProps {
  materials: SongMaterial[]
  /** Kind currently being uploaded, to show progress on its button. */
  uploadingKind?: MaterialKind
  /** A file was picked for a kind; the page checks it and asks for a title before uploading. */
  onPick: (kind: MaterialKind, file: File) => void
  onDelete: (material: SongMaterial) => void
  onEdit: (material: SongMaterial) => void
  /** Opens who has learned the material (FE-09). */
  onProgress: (material: SongMaterial) => void
}

function formatSize(bytes: number | null): string | undefined {
  if (!bytes) return undefined
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

const kindIcons: Record<MaterialKind, ComponentType> = {
  sheetMusic: ReadOutlined,
  lyrics: FileTextOutlined,
  sampleAudio: CustomerServiceOutlined,
  rehearsalMaterial: FolderOpenOutlined,
}

function UploadButton({ kind, loading, label, onPick }: {
  kind: MaterialKind
  loading: boolean
  label: string
  onPick: (kind: MaterialKind, file: File) => void
}) {
  return (
    <Upload
      showUploadList={false}
      accept={materialExtensions[kind].join(',')}
      beforeUpload={(file) => {
        onPick(kind, file)
        return false
      }}
    >
      <Button icon={<UploadOutlined />} loading={loading} aria-label={`${label}: ${materialKindLabels[kind]}`}>
        {label}
      </Button>
    </Upload>
  )
}

type MaterialActions = Pick<SongMaterialsCardProps, 'onDelete' | 'onEdit' | 'onProgress'>

function MaterialRow({ material, onDelete, onEdit, onProgress }: { material: SongMaterial } & MaterialActions) {
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
        <Flex wrap align="center" gap={spacing.xs}>
          <Typography.Text strong ellipsis={{ tooltip: material.title }}>
            {material.title}
          </Typography.Text>
          {material.targetSkillName && <Tag style={{ marginInlineEnd: 0 }}>{material.targetSkillName}</Tag>}
        </Flex>
        <Typography.Text
          ellipsis={{ tooltip: material.fileName }}
          style={{ color: colors.textMuted, fontSize: typography.metadata.fontSize }}
        >
          {[material.fileName, formatSize(material.fileSizeBytes), `tải lên ${dayjs(parseUtc(material.createdAt)).format('DD/MM/YYYY')}`]
            .filter(Boolean)
            .join(' · ')}
        </Typography.Text>
      </Flex>
      {material.kind === 'sampleAudio' && (
        <audio controls preload="none" src={material.url} aria-label={`Nghe ${material.title}`} style={{ height: 36 }} />
      )}
      {/* Signed URLs expire; the list is refetched when the window regains focus, which renews them. */}
      <Button type="link" href={material.url} target="_blank" rel="noopener noreferrer">
        Xem/Tải xuống
      </Button>
      <Button icon={<BarChartOutlined />} onClick={() => onProgress(material)} aria-label={`Tiến độ học ${material.title}`}>
        Tiến độ học
      </Button>
      <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(material)} aria-label={`Sửa ${material.title}`} />
      <Button
        type="text"
        danger
        icon={<DeleteOutlined />}
        onClick={() => onDelete(material)}
        aria-label={`Xoá ${material.title}`}
      />
    </Flex>
  )
}

/** Materials grouped by the four FE-08/FE-28 kinds, each with its own upload action. */
export function SongMaterialsCard({ materials, uploadingKind, onPick, ...actions }: SongMaterialsCardProps) {
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
                <UploadButton kind={kind} label="Tải lên" loading={uploadingKind === kind} onPick={onPick} />
              </Flex>
              {items.length > 0 ? (
                <Flex component="ul" vertical gap={spacing.sm} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {items.map((material) => (
                    <MaterialRow key={material.id} material={material} {...actions} />
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
