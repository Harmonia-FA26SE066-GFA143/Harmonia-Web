import { AlignLeftOutlined, CustomerServiceOutlined, FileTextOutlined } from '@ant-design/icons'
import { Flex, Pagination, Spin, Tag } from 'antd'
import type { ReactNode } from 'react'
import { generatePath, Link, useLocation } from 'react-router'
import { paths } from '@/app/router/paths'
import { colors, spacing, typography } from '@/styles/tokens'
import { songListState } from '../songFilters'
import { materialKindLabels, type MaterialKind, type Song } from '../types'
import type { DensityMode } from './viewStorage'

export interface SongIndexListProps {
  songs: Song[]
  /** Server-side paging of GET /api/songs. */
  page: number
  pageSize: number
  total: number
  loading?: boolean
  density?: DensityMode
  onPageChange: (page: number) => void
}

// Rehearsal material stays in the table's count; the index names what a singer looks for first.
const shownMaterials: { kind: MaterialKind; icon: ReactNode }[] = [
  { kind: 'sheetMusic', icon: <FileTextOutlined /> },
  { kind: 'lyrics', icon: <AlignLeftOutlined /> },
  { kind: 'sampleAudio', icon: <CustomerServiceOutlined /> },
]

/** A material in words, as the "Thiếu tài liệu" filter names it; a missing one is muted, never struck through. */
function MaterialMark({ kind, icon, available }: Readonly<{ kind: MaterialKind; icon: ReactNode; available: boolean }>) {
  const label = materialKindLabels[kind]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: spacing.xs,
        fontSize: typography.metadata.fontSize,
        color: available ? colors.textBody : colors.textMuted,
      }}
    >
      <span aria-hidden style={{ display: 'inline-flex', color: available ? colors.primary : colors.textMuted }}>
        {icon}
      </span>
      {available ? label : `Chưa có ${label.toLowerCase()}`}
    </span>
  )
}

/**
 * The music library as a songbook index (2026-10-31): one line per song of GET /api/songs, the title linking to the
 * song page, its credits, key and tempo and how often it served, and which materials it has (SongDto counts). SongDto
 * carries no season or Mass part, so the index does not show them.
 */
export function SongIndexList({
  songs,
  page,
  pageSize,
  total,
  loading,
  density = 'comfortable',
  onPageChange,
}: Readonly<SongIndexListProps>) {
  const { search } = useLocation()
  const rowPadding = density === 'compact' ? `${spacing.sm}px ${spacing.md}px` : `${spacing.md}px`

  return (
    <div role="region" aria-label="Mục lục bài hát">
      <Spin spinning={loading}>
        {/* role="list": the list-style reset drops list semantics in Safari. */}
        <ul role="list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {songs.map((song) => {
            const credits = [song.composer, song.lyricist && song.lyricist !== song.composer && song.lyricist].filter(Boolean)
            const details = [
              credits.length > 0 ? credits.join(' / ') : 'Chưa ghi tác giả',
              song.musicalKey && `Giọng ${song.musicalKey}`,
              song.tempo && `Nhịp ${song.tempo}`,
              song.timesUsed !== undefined && song.timesUsed > 0 && `Đã dùng ${song.timesUsed} lần`,
            ].filter(Boolean)

            return (
              <li
                key={song.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: spacing.md,
                  padding: rowPadding,
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Flex align="center" gap={spacing.sm} wrap>
                    <Link
                      to={generatePath(paths.director.songDetail, { songId: song.id })}
                      state={songListState(search)}
                      style={{
                        fontWeight: 600,
                        fontSize: typography.cardHeading.fontSize,
                        color: colors.textPrimary,
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {song.title}
                    </Link>
                    {song.isClassified === false && (
                      <Tag color="warning" style={{ marginInlineEnd: 0 }}>
                        Chưa phân loại
                      </Tag>
                    )}
                  </Flex>
                  <div style={{ marginTop: spacing.xs, fontSize: typography.metadata.fontSize, color: colors.textMuted }}>
                    {details.join(' · ')}
                  </div>
                </div>

                {song.materialCounts && (
                  <Flex gap={spacing.md} align="center" style={{ flexShrink: 0 }}>
                    {shownMaterials.map(({ kind, icon }) => (
                      <MaterialMark key={kind} kind={kind} icon={icon} available={(song.materialCounts?.[kind] ?? 0) > 0} />
                    ))}
                  </Flex>
                )}
              </li>
            )
          })}
        </ul>

        <Flex justify="end" style={{ padding: spacing.md }}>
          <Pagination current={page} pageSize={pageSize} total={total} showSizeChanger={false} onChange={onPageChange} />
        </Flex>
      </Spin>
    </div>
  )
}
