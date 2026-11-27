import { Button, Divider, Flex, Image, Tag, Tooltip, Typography } from 'antd'
import dayjs from 'dayjs'
import { Fragment, useRef } from 'react'
import { parseUtc } from '@/lib/api/dates'
import { Icon, visuallyHidden, type IconName } from '@/shared/ui'
import { colors, radius, spacing, typography } from '@/styles/tokens'
import {
  fileExtension,
  isMidiFile,
  isPlayableAudio,
  isScoreFile,
  materialExtensions,
  materialKindLabels,
  materialKinds,
  maxMaterialBytes,
  rendersPlayback,
  supportsTimedLyrics,
  type MaterialKind,
  type SongMaterial,
} from '../types'
import { AudioWaveform } from './AudioWaveform'

/** Without the handlers the card is read-only (the Parish Priest reviewing a song list): view and download only. */
export interface SongMaterialsPanelProps {
  materials: SongMaterial[]
  /** A reading surface for the full song page; embedded review drawers keep their compact layout. */
  readingLayout?: boolean
  /** Kind currently being uploaded, to show progress on its button. */
  uploadingKind?: MaterialKind
  /** A file was picked for a kind; the page checks it and asks for a title before uploading. */
  onPick?: (kind: MaterialKind, file: File) => void
  onDelete?: (material: SongMaterial) => void
  onEdit?: (material: SongMaterial) => void
  /** Replaces the file, keeping the material and what members marked. */
  onReplace?: (material: SongMaterial) => void
  /** Opens who has learned the material (FE-09). */
  onProgress?: (material: SongMaterial) => void
  /** Adds lyrics typed as text instead of a Word file. */
  onTypeLyrics?: () => void
  /** Asks the AI for a draft of the lyrics printed on a sheet music file. */
  onExtractLyrics?: (material: SongMaterial) => void
  /** Sheet music whose lyrics are being read (background tasks: several may run, each once). */
  extractingIds?: ReadonlySet<string>
  /** Opens the editor of the lyrics timed to an audio material. */
  onTimedLyrics?: (material: SongMaterial) => void
}

function formatSize(bytes: number | null): string | undefined {
  if (!bytes) return undefined
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

const isImage = ({ fileName }: SongMaterial) => fileName !== null && ['.png', '.jpg', '.jpeg'].includes(fileExtension(fileName))

/** What is under the title: file name, size and date, or what kind of text it is. */
function details(material: SongMaterial) {
  const source = material.lyricsText === null ? material.fileName : 'Lời gõ trực tiếp'
  const playback = isMidiFile(material.fileName)
    ? 'MIDI, nghe trên ứng dụng di động'
    : isScoreFile(material.fileName)
      ? 'MusicXML, máy chủ dựng sẵn bản phát'
      : undefined
  return [source, playback, formatSize(material.fileSizeBytes), `tải lên ${dayjs(parseUtc(material.createdAt)).format('DD/MM/YYYY')}`]
    .filter(Boolean)
    .join(' · ')
}

const kindIcons: Record<MaterialKind, IconName> = {
  sheetMusic: 'sheet-music',
  lyrics: 'lyrics',
  sampleAudio: 'audio',
  rehearsalMaterial: 'folder-open',
  interactiveScore: 'play',
}

function UploadButton({ kind, loading, label, hintId, onPick }: Readonly<{
  kind: MaterialKind
  loading: boolean
  label: string
  /** Element that tells which files are accepted. */
  hintId: string
  onPick: (kind: MaterialKind, file: File) => void
}>) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={materialExtensions[kind].join(',')}
        tabIndex={-1}
        aria-hidden="true"
        style={visuallyHidden}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0]
          event.currentTarget.value = ''
          if (file) onPick(kind, file)
        }}
      />
      <Button
        icon={<Icon name="upload" />}
        loading={loading}
        aria-label={`${label}: ${materialKindLabels[kind]}`}
        aria-describedby={hintId}
        onClick={() => inputRef.current?.click()}
      >
        {label}
      </Button>
    </>
  )
}

type MaterialActions = Pick<SongMaterialsPanelProps, 'onDelete' | 'onEdit' | 'onProgress' | 'onReplace' | 'onExtractLyrics' | 'extractingIds' | 'onTimedLyrics'>

function MaterialRow({
  material,
  readingLayout,
  onDelete,
  onEdit,
  onProgress,
  onReplace,
  onExtractLyrics,
  extractingIds,
  onTimedLyrics,
}: Readonly<{ material: SongMaterial; readingLayout: boolean } & MaterialActions>) {
  return (
    <Flex component="li" vertical gap={spacing.sm} style={{ padding: spacing.md, background: colors.background, borderRadius: radius.md }}>
      <Flex wrap align="center" gap={spacing.md}>
        {isImage(material) ? (
          // A sheet or lyrics page is recognised at a glance; the preview opens it full size.
          <Image
            src={material.url ?? undefined}
            alt={`Trang đầu của ${material.title}`}
            width={48}
            height={60}
            style={{ objectFit: 'cover', borderRadius: radius.sm, border: `1px solid ${colors.border}` }}
          />
        ) : (
          <span aria-hidden style={{ color: colors.primary, fontSize: 20 }}>
            <Icon name={kindIcons[material.kind]} />
          </span>
        )}
        <Flex vertical style={{ flex: readingLayout ? '1 1 260px' : '1 1 200px', minWidth: 0 }}>
          <Flex wrap align="center" gap={spacing.xs}>
            <Typography.Text strong ellipsis={readingLayout ? false : { tooltip: material.title }} style={{ overflowWrap: 'anywhere' }}>
              {material.title}
            </Typography.Text>
            {material.targetSkillName && <Tag style={{ marginInlineEnd: 0 }}>{material.targetSkillName}</Tag>}
          </Flex>
          <Typography.Text
            ellipsis={readingLayout ? false : { tooltip: material.fileName ?? undefined }}
            style={{ color: colors.textMuted, fontSize: typography.metadata.fontSize, overflowWrap: 'anywhere' }}
          >
            {details(material)}
          </Typography.Text>
        </Flex>
        <Flex wrap align="center" gap={spacing.xs}>
          {/* Signed URLs expire; the list is refetched when the window regains focus, which renews them. */}
          {/* MIDI and MusicXML do not open in a browser tab; they are downloaded. */}
          {material.url &&
            (rendersPlayback(material.fileName) ? (
              <Button type="link" icon={<Icon name="download" />} href={material.url} aria-label={`Tải xuống ${material.title}`}>
                Tải xuống
              </Button>
            ) : (
              <Button
                type="link"
                icon={<Icon name="export" />}
                href={material.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Xem/Tải xuống ${material.title} (mở tab mới)`}
              >
                Xem/Tải xuống
              </Button>
            ))}
          {onExtractLyrics && material.kind === 'sheetMusic' && material.url && (
            <Button
              icon={<Icon name="liturgy-tip" />}
              loading={extractingIds?.has(material.id)}
              onClick={() => onExtractLyrics(material)}
              aria-label={`Trích lời từ ${material.title}`}
            >
              Trích lời
            </Button>
          )}
          {onTimedLyrics && supportsTimedLyrics(material) && (
            <Button icon={<Icon name="history" />} onClick={() => onTimedLyrics(material)} aria-label={`Soạn lời theo thời gian cho ${material.title}`}>
              Lời theo thời gian
            </Button>
          )}
          {onProgress && (
            <Button icon={<Icon name="report" />} onClick={() => onProgress(material)} aria-label={`Xem tiến độ học ${material.title}`}>
              Tiến độ học
            </Button>
          )}
          {/* Icon-only actions: the tooltip shows on hover and keyboard focus what the aria-label says. */}
          {/* Typed lyrics have no file to replace; they are edited as text. */}
          {onReplace && material.lyricsText === null && (
            <Tooltip title="Thay file" trigger={['hover', 'focus']}>
              <Button type="text" icon={<Icon name="swap" />} onClick={() => onReplace(material)} aria-label={`Thay file ${material.title}`} />
            </Tooltip>
          )}
          {onEdit && (
            <Tooltip title="Sửa tài liệu" trigger={['hover', 'focus']}>
              <Button type="text" icon={<Icon name="edit" />} onClick={() => onEdit(material)} aria-label={`Sửa ${material.title}`} />
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip title="Xoá tài liệu" trigger={['hover', 'focus']}>
              <Button
                type="text"
                danger
                icon={<Icon name="delete" />}
                onClick={() => onDelete(material)}
                aria-label={`Xoá ${material.title}`}
              />
            </Tooltip>
          )}
        </Flex>
      </Flex>
      {material.url && isPlayableAudio(material) && <AudioWaveform url={material.url} title={material.title} />}
      {material.lyricsText !== null && (
        <Typography.Paragraph
          ellipsis={{ rows: 4, expandable: 'collapsible', symbol: (expanded) => (expanded ? 'Thu gọn' : 'Xem hết lời') }}
          style={{ margin: 0, whiteSpace: 'pre-line', maxWidth: readingLayout ? '72ch' : undefined, overflowWrap: 'anywhere' }}
        >
          {material.lyricsText}
        </Typography.Paragraph>
      )}
    </Flex>
  )
}

/**
 * Materials grouped by the four FE-08/FE-28 kinds, each with its own upload action: the "Tài liệu" tab of the song page
 * and the body of the Parish Priest's materials drawer.
 */
export function SongMaterialsPanel({ materials, readingLayout = false, uploadingKind, onPick, onTypeLyrics, ...actions }: Readonly<SongMaterialsPanelProps>) {
  return (
    <div>
      {materialKinds.map((kind, index) => {
        const items = materials.filter((material) => material.kind === kind)
        const headingId = `materials-${kind}`
        const hintId = `materials-${kind}-hint`
        return (
          <Fragment key={kind}>
            {index > 0 && !readingLayout && <Divider />}
            <section aria-labelledby={headingId} style={readingLayout ? {
              padding: items.length > 0 ? spacing.lg : `${spacing.md}px ${spacing.lg}px`,
              marginBottom: spacing.md,
              background: colors.ivory,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.lg,
            } : undefined}>
              <Flex align="center" justify="space-between" gap={spacing.sm} style={{ marginBottom: spacing.xs }}>
                <Typography.Title
                  id={headingId}
                  level={readingLayout ? 3 : 2}
                  style={{
                    margin: 0,
                    fontSize: typography.cardHeading.fontSize,
                    scrollMarginTop: 'calc(var(--hm-header-height) + var(--hm-subnav-height) + 20px)',
                  }}
                >
                  {materialKindLabels[kind]}
                </Typography.Title>
                <Flex gap={spacing.xs}>
                  {kind === 'lyrics' && onTypeLyrics && (
                    <Button icon={<Icon name="edit" />} onClick={onTypeLyrics}>
                      Gõ lời
                    </Button>
                  )}
                  {onPick && <UploadButton kind={kind} label="Tải lên" hintId={hintId} loading={uploadingKind === kind} onPick={onPick} />}
                </Flex>
              </Flex>
              {/* The limits are known before a file is picked, not only when a wrong one is refused. */}
              {onPick && (
                <Typography.Paragraph
                  id={hintId}
                  style={{ margin: `0 0 ${spacing.sm}px`, color: colors.textMuted, fontSize: typography.metadata.fontSize }}
                >
                  Nhận tệp {materialExtensions[kind].join(', ')}, tối đa {maxMaterialBytes / 1024 / 1024} MB
                  {kind === 'lyrics' && ', hoặc gõ lời trực tiếp'}
                  {kind === 'sheetMusic' && actions.onExtractLyrics && '. Nút Trích lời nhờ AI đọc lời trên bản nhạc'}.
                </Typography.Paragraph>
              )}
              {items.length > 0 ? (
                <Flex component="ul" vertical gap={spacing.sm} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {items.map((material) => (
                    <MaterialRow key={material.id} material={material} readingLayout={readingLayout} {...actions} />
                  ))}
                </Flex>
              ) : (
                <Typography.Text
                  style={{
                    display: 'block',
                    padding: `${spacing.sm}px ${spacing.md}px`,
                    border: `1px dashed ${colors.border}`,
                    borderRadius: radius.md,
                    color: colors.textMuted,
                    fontSize: typography.metadata.fontSize,
                  }}
                >
                  Chưa có tài liệu
                </Typography.Text>
              )}
            </section>
          </Fragment>
        )
      })}
    </div>
  )
}
