import {
  BarChartOutlined,
  CustomerServiceOutlined,
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  ReadOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import { Button, Card, Divider, Flex, Image, Tag, Typography, Upload } from 'antd'
import dayjs from 'dayjs'
import { Fragment, type ComponentType } from 'react'
import { parseUtc } from '@/lib/api/dates'
import { colors, radius, spacing, typography } from '@/styles/tokens'
import {
  materialExtensions,
  materialKindLabels,
  materialKinds,
  maxMaterialBytes,
  type MaterialKind,
  type SongMaterial,
} from '../types'
import { CardTitle } from '@/shared/ui'
import { AudioWaveform } from './AudioWaveform'

/** Without the handlers the card is read-only (the Parish Priest reviewing a song list): view and download only. */
export interface SongMaterialsCardProps {
  materials: SongMaterial[]
  /** Kind currently being uploaded, to show progress on its button. */
  uploadingKind?: MaterialKind
  /** A file was picked for a kind; the page checks it and asks for a title before uploading. */
  onPick?: (kind: MaterialKind, file: File) => void
  onDelete?: (material: SongMaterial) => void
  onEdit?: (material: SongMaterial) => void
  /** Opens who has learned the material (FE-09). */
  onProgress?: (material: SongMaterial) => void
}

function formatSize(bytes: number | null): string | undefined {
  if (!bytes) return undefined
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

const extension = (fileName: string) => fileName.slice(fileName.lastIndexOf('.')).toLowerCase()
const isAudio = ({ fileName }: SongMaterial) => ['.mp3', '.m4a', '.wav'].includes(extension(fileName))
const isImage = ({ fileName }: SongMaterial) => ['.png', '.jpg', '.jpeg'].includes(extension(fileName))

const kindIcons:Record<MaterialKind, ComponentType> = {
  sheetMusic: ReadOutlined,
  lyrics: FileTextOutlined,
  sampleAudio: CustomerServiceOutlined,
  rehearsalMaterial: FolderOpenOutlined,
}

function UploadButton({ kind, loading, label, hintId, onPick }: Readonly<{
  kind: MaterialKind
  loading: boolean
  label: string
  /** Element that tells which files are accepted. */
  hintId: string
  onPick: (kind: MaterialKind, file: File) => void
}>) {
  return (
    <Upload
      showUploadList={false}
      accept={materialExtensions[kind].join(',')}
      beforeUpload={(file) => {
        onPick(kind, file)
        return false
      }}
    >
      <Button
        icon={<UploadOutlined />}
        loading={loading}
        aria-label={`${label}: ${materialKindLabels[kind]}`}
        aria-describedby={hintId}
      >
        {label}
      </Button>
    </Upload>
  )
}

type MaterialActions = Pick<SongMaterialsCardProps, 'onDelete' | 'onEdit' | 'onProgress'>

function MaterialRow({ material, onDelete, onEdit, onProgress }: Readonly<{ material: SongMaterial } & MaterialActions>) {
  const Icon = kindIcons[material.kind]
  return (
    <Flex component="li" vertical gap={spacing.sm} style={{ padding: spacing.md, background: colors.background, borderRadius: radius.md }}>
      <Flex wrap align="center" gap={spacing.md}>
        {isImage(material) ? (
          // A sheet or lyrics page is recognised at a glance; the preview opens it full size.
          <Image
            src={material.url}
            alt={`Trang đầu của ${material.title}`}
            width={48}
            height={60}
            style={{ objectFit: 'cover', borderRadius: radius.sm, border: `1px solid ${colors.border}` }}
          />
        ) : (
          <span aria-hidden style={{ color: colors.primary, fontSize: 20 }}>
            <Icon />
          </span>
        )}
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
        {/* Signed URLs expire; the list is refetched when the window regains focus, which renews them. */}
        <Button
          type="link"
          icon={<ExportOutlined />}
          href={material.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Xem/Tải xuống ${material.title} (mở tab mới)`}
        >
          Xem/Tải xuống
        </Button>
        {onProgress && (
          <Button icon={<BarChartOutlined />} onClick={() => onProgress(material)} aria-label={`Tiến độ học ${material.title}`}>
            Tiến độ học
          </Button>
        )}
        {onEdit && (
          <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(material)} aria-label={`Sửa ${material.title}`} />
        )}
        {onDelete && (
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDelete(material)}
            aria-label={`Xoá ${material.title}`}
          />
        )}
      </Flex>
      {isAudio(material) && <AudioWaveform url={material.url} title={material.title} />}
    </Flex>
  )
}

/** Materials grouped by the four FE-08/FE-28 kinds, each with its own upload action. */
export function SongMaterialsCard({ materials, uploadingKind, onPick, ...actions }: Readonly<SongMaterialsCardProps>) {
  return (
    <Card title={<CardTitle>Tài liệu</CardTitle>}>
      {materialKinds.map((kind, index) => {
        const items = materials.filter((material) => material.kind === kind)
        const headingId = `materials-${kind}`
        const hintId = `materials-${kind}-hint`
        return (
          <Fragment key={kind}>
            {index > 0 && <Divider />}
            <section aria-labelledby={headingId}>
              <Flex align="center" justify="space-between" gap={spacing.sm} style={{ marginBottom: spacing.xs }}>
                <Typography.Title id={headingId} level={3} style={{ margin: 0 }}>
                  {materialKindLabels[kind]}
                </Typography.Title>
                {onPick && <UploadButton kind={kind} label="Tải lên" hintId={hintId} loading={uploadingKind === kind} onPick={onPick} />}
              </Flex>
              {/* The limits are known before a file is picked, not only when a wrong one is refused. */}
              {onPick && (
                <Typography.Paragraph
                  id={hintId}
                  style={{ margin: `0 0 ${spacing.sm}px`, color: colors.textMuted, fontSize: typography.metadata.fontSize }}
                >
                  Nhận tệp {materialExtensions[kind].join(', ')}, tối đa {maxMaterialBytes / 1024 / 1024} MB.
                </Typography.Paragraph>
              )}
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
