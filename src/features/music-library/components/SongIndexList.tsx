import { AlignLeftOutlined, ArrowRightOutlined, CustomerServiceOutlined } from '@ant-design/icons'
import { Flex, Pagination, Spin, Tag } from 'antd'
import { useState, type ReactNode } from 'react'
import { generatePath, Link, useLocation } from 'react-router'
import { paths } from '@/app/router/paths'
import { SheetMusicOutlined } from '@/shared/ui'
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
  { kind: 'sheetMusic', icon: <SheetMusicOutlined /> },
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

/** Page 1 of the sheet, to know a song by sight; a blank page mark when there is none or it fails. The title names the song. */
function SongThumbnail({ url }: Readonly<{ url?: string | null }>) {
  const [failed, setFailed] = useState(false)
  return (
    <span aria-hidden className="song-index__thumb">
      {url && !failed ? <img src={url} alt="" loading="lazy" onError={() => setFailed(true)} /> : <SheetMusicOutlined />}
    </span>
  )
}

/**
 * The music library as the contents page of a hymnal: ruled lines, the number and title in the display serif, credits
 * under the title, and which materials the song has (SongDto counts). The title's link covers the whole line. SongDto
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

  return (
    <div role="region" aria-label="Mục lục bài hát">
      <Spin spinning={loading}>
        <ul className={`hm-stagger song-index${density === 'compact' ? ' is-compact' : ''}`}>
          {songs.map((song, index) => {
            const credits = [song.composer, song.lyricist && song.lyricist !== song.composer && song.lyricist].filter(Boolean)
            const details = [
              credits.length > 0 ? credits.join(' / ') : 'Chưa ghi tác giả',
              song.musicalKey && `Giọng ${song.musicalKey}`,
              song.tempo && `Nhịp ${song.tempo}`,
              song.timesUsed !== undefined && song.timesUsed > 0 && `Đã dùng ${song.timesUsed} lần`,
            ].filter(Boolean)

            return (
              <li key={song.id} className="song-index__row">
                <span aria-hidden className="song-index__number">
                  {(page - 1) * pageSize + index + 1}
                </span>
                {density !== 'compact' && <SongThumbnail url={song.sheetMusicThumbnailUrl} />}
                <div style={{ minWidth: 0 }}>
                  <Flex align="center" gap={spacing.sm} wrap>
                    <Link to={generatePath(paths.director.songDetail, { songId: song.id })} state={songListState(search)} className="song-index__title">
                      {song.title}
                    </Link>
                    {song.isClassified === false && (
                      <Tag color="warning" style={{ marginInlineEnd: 0 }}>
                        Chưa phân loại
                      </Tag>
                    )}
                  </Flex>
                  <div className="song-index__details">{details.join(' · ')}</div>
                </div>
                {song.materialCounts ? (
                  <div className="song-index__materials">
                    {shownMaterials.map(({ kind, icon }) => (
                      <MaterialMark key={kind} kind={kind} icon={icon} available={(song.materialCounts?.[kind] ?? 0) > 0} />
                    ))}
                  </div>
                ) : (
                  <span />
                )}
                <ArrowRightOutlined aria-hidden className="song-index__arrow" />
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
