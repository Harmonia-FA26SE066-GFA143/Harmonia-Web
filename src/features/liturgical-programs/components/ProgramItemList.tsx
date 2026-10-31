import { Flex, Typography } from 'antd'
import type { ReactNode } from 'react'
import { colors, spacing } from '@/styles/tokens'
import { useSongCredits } from '../hooks/usePrograms'

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
}

const muted = { color: colors.textMuted, fontSize: 13 }

/** Composer and lyricist, and how many files are attached (SongDto); nothing while they load or if they fail. */
function Credits({ songId }: Readonly<{ songId?: string }>) {
  const credits = useSongCredits(songId)
  if (!credits.data) return null
  const { composer, lyricist, materials } = credits.data
  const line = [composer && `Nhạc: ${composer}`, lyricist && `Lời: ${lyricist}`, materials > 0 ? `${materials} tài liệu đính kèm` : 'Chưa có tài liệu đính kèm']
    .filter(Boolean)
    .join(' · ')
  return <Typography.Text style={muted}>{line}</Typography.Text>
}

/**
 * A program read like a missal page, not a table: each song in order with its place in the Mass, its title, who wrote
 * it, its attachments and the Choir Director's note. Order and fields come from the song list (SongListItemDto).
 */
export function ProgramItemList({ items, renderAction }: Readonly<ProgramItemListProps>) {
  return (
    <ol aria-label="Các bài hát theo thứ tự trong lễ" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
      {items.map((item, index) => (
        <li
          key={item.id}
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
            <Credits songId={item.songId} />
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
  )
}
