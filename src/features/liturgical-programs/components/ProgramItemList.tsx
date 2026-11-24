import { Flex, Typography } from 'antd'
import type { ReactNode } from 'react'
import { MATERIAL_LABELS, StaffDivider, StatusTag } from '@/shared/ui'
import { colors, spacing } from '@/styles/tokens'
import { useSongCredits } from '../hooks/usePrograms'
import type { SongCredits } from '../types'

export interface ProgramItem {
  id: string
  songId?: string
  /** The place in the Mass (Ca nhập lễ, Đáp ca…). */
  slotName?: string
  title: string
  /** The Choir Director's note on this song. */
  note?: string
}

export interface ProgramItemListProps {
  items: ProgramItem[]
  /** An action beside each song, e.g. opening its materials. */
  renderAction?: (item: ProgramItem) => ReactNode
  /** The Director's readiness of each part: which kinds of files the song has, as chips, instead of a file count. */
  showMaterials?: boolean
  /** Further readiness marks under a song, e.g. its staffing. */
  renderStatus?: (item: ProgramItem) => ReactNode
}

const muted = { color: colors.textMuted, fontSize: 13 }
const chip = { marginInlineEnd: 0 }

type MaterialKind = keyof NonNullable<SongCredits['materialCounts']>
const materialOrder: MaterialKind[] = ['sheetMusic', 'sampleAudio', 'lyrics', 'interactiveScore', 'rehearsalMaterial']

/** The kinds of files a song has (`SongDto.MaterialCounts`), one quiet chip each; one line when it has none. */
function MaterialChips({ counts }: Readonly<{ counts: NonNullable<SongCredits['materialCounts']> }>) {
  const present = materialOrder.filter((kind) => counts[kind] > 0)
  if (present.length === 0) return <StatusTag mark="draft" style={chip}>Chưa có tài liệu đính kèm</StatusTag>
  return (
    <>
      {present.map((kind) => (
        <StatusTag key={kind} style={chip}>
          {MATERIAL_LABELS[kind]}
        </StatusTag>
      ))}
    </>
  )
}

/** Composer and lyricist, and the attachments (SongDto); nothing while they load or if they fail. */
function Credits({ songId, title, showMaterials }: Readonly<{ songId?: string; title: string; showMaterials?: boolean }>) {
  const credits = useSongCredits(songId)
  if (!credits.data) return null
  const { composer, lyricist, materials, materialCounts } = credits.data
  const chips = showMaterials && materialCounts
  const line = [
    composer && `Nhạc: ${composer}`,
    lyricist && `Lời: ${lyricist}`,
    !chips && (materials > 0 ? `${materials} tài liệu đính kèm` : 'Chưa có tài liệu đính kèm'),
  ]
    .filter(Boolean)
    .join(' · ')
  return (
    <>
      {line && <Typography.Text style={muted}>{line}</Typography.Text>}
      {chips && (
        <Flex wrap gap={spacing.xs} role="group" aria-label={`Tài liệu của ${title}`} style={{ marginTop: spacing.xs }}>
          <MaterialChips counts={materialCounts} />
        </Flex>
      )}
    </>
  )
}

/**
 * A program read like a missal page, not a table: each song in order with its place in the Mass, its title, who wrote
 * it, its attachments and the Choir Director's note. Order and fields come from the song list (SongListItemDto).
 */
export function ProgramItemList({ items, renderAction, showMaterials, renderStatus }: Readonly<ProgramItemListProps>) {
  return (
    <>
    <ol aria-label="Các bài hát theo thứ tự trong lễ" className="hm-stagger" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
      {items.map((item, index) => (
        <li
          key={item.id}
          className="ct-order__item"
          style={{
            display: 'grid',
            gridTemplateColumns: '40px minmax(0, 1fr) auto',
            columnGap: spacing.md,
            alignItems: 'start',
            padding: `${spacing.md}px 0`,
            borderTop: index > 0 ? `1px solid ${colors.border}` : undefined,
          }}
        >
          <span
            aria-hidden
            // Be Vietnam Pro, not the display serif: Cormorant's old-style "1" reads as "ı".
            style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.3, color: colors.primary }}
          >
            {index + 1}
          </span>
          <Flex vertical gap={2} style={{ minWidth: 0, maxWidth: '72ch' }}>
            {item.slotName && <Typography.Text style={{ ...muted, fontWeight: 500 }}>{item.slotName}</Typography.Text>}
            <Typography.Text style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.4 }}>{item.title}</Typography.Text>
            <Credits songId={item.songId} title={item.title} showMaterials={showMaterials} />
            {renderStatus?.(item)}
            {item.note && (
              <Typography.Text style={{ marginTop: spacing.xs, color: colors.textBody }}>
                <span style={{ color: colors.textMuted }}>Ghi chú của Ca trưởng: </span>
                {item.note}
              </Typography.Text>
            )}
          </Flex>
          {renderAction && <div style={{ alignSelf: 'center' }}>{renderAction(item)}</div>}
        </li>
      ))}
    </ol>
    {/* The end of the reading, once per page. */}
    <StaffDivider />
    </>
  )
}
