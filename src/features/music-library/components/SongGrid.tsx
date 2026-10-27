import { Card, Flex, Pagination, Spin, Tag, Typography } from 'antd'
import { generatePath, Link, useLocation } from 'react-router'
import { paths } from '@/app/router/paths'
import { colors, spacing, typography } from '@/styles/tokens'
import { songListState } from '../songFilters'
import type { Song } from '../types'
import { StaffMotif } from './StaffMotif'

export interface SongGridProps {
  songs: Song[]
  /** Server-side paging of GET /api/songs. */
  page: number
  pageSize: number
  total: number
  loading?: boolean
  onPageChange: (page: number) => void
}

const muted = { color: colors.textMuted, fontSize: typography.metadata.fontSize }

/** Musical key and tempo, the two fields a choir reads first. */
function MusicTags({ song }: Readonly<{ song: Song }>) {
  if (!song.musicalKey && !song.tempo) return null
  return (
    <Flex wrap gap={spacing.sm}>
      {song.musicalKey && (
        <Tag variant="filled" style={{ marginInlineEnd: 0, background: colors.primarySoft, color: colors.primary, fontWeight: 600 }}>
          Giọng {song.musicalKey}
        </Tag>
      )}
      {song.tempo && <Tag style={{ marginInlineEnd: 0 }}>Nhịp {song.tempo}</Tag>}
    </Flex>
  )
}

/** How often the song served, how many materials it has, and whether it still needs classifying (SongDto counts). */
function LibraryFacts({ song }: Readonly<{ song: Song }>) {
  if (song.timesUsed === undefined && song.materialCounts === undefined) return null
  const facts: string[] = []
  if (song.timesUsed !== undefined) facts.push(song.timesUsed > 0 ? `Đã dùng ${song.timesUsed} lần` : 'Chưa dùng')
  if (song.materialCounts) {
    const materials = Object.values(song.materialCounts).reduce((sum, count) => sum + count, 0)
    facts.push(materials > 0 ? `${materials} tài liệu` : 'Chưa có tài liệu')
  }
  return (
    <Flex wrap align="center" gap={spacing.sm}>
      <Typography.Text style={muted}>{facts.join(' · ')}</Typography.Text>
      {song.isClassified === false && (
        <Tag color="warning" style={{ marginInlineEnd: 0 }}>
          Chưa phân loại
        </Tag>
      )}
    </Flex>
  )
}

/**
 * Library overview as song cards: fields, how often each song served and its materials (SongDto counts); the
 * classification itself is on the song page. The title is the card's link; it stretches over the card, so the whole
 * card is clickable and the link's name stays the song title.
 */
export function SongGrid({ songs, page, pageSize, total, loading, onPageChange }: Readonly<SongGridProps>) {
  const { search } = useLocation()
  return (
    <Spin spinning={!!loading} delay={100}>
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: spacing.md,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))',
          gap: spacing.md,
        }}
      >
        {songs.map((song) => {
          const credits = [song.composer && `Nhạc: ${song.composer}`, song.lyricist && `Lời: ${song.lyricist}`].filter(Boolean)
          return (
            <li key={song.id}>
              <Card
                hoverable
                className="song-card"
                style={{ height: '100%', position: 'relative', overflow: 'hidden' }}
                styles={{ body: { padding: 0, height: '100%' } }}
              >
                <div style={{ background: 'rgba(142, 59, 75, 0.05)', padding: `${spacing.sm}px 0` }}>
                  <StaffMotif seed={song.id} height={48} />
                </div>
                <Flex vertical gap={spacing.xs} style={{ padding: spacing.md }}>
                  <Link
                    className="song-card-link"
                    to={generatePath(paths.director.songDetail, { songId: song.id })}
                    state={songListState(search)}
                    style={{ fontWeight: 600, fontSize: 15.5, color: colors.textPrimary, lineHeight: 1.35 }}
                  >
                    {song.title}
                  </Link>
                  <Typography.Text style={muted} ellipsis={{ tooltip: credits.join(' · ') }}>
                    {credits.length > 0 ? credits.join(' · ') : 'Chưa ghi nhạc sĩ'}
                  </Typography.Text>
                  <MusicTags song={song} />
                  <LibraryFacts song={song} />
                </Flex>
              </Card>
            </li>
          )
        })}
      </ul>
      {/* Shown on a single page too, so the end of the list reads as the end. */}
      <Flex justify="flex-end" style={{ padding: `0 ${spacing.md}px ${spacing.md}px` }}>
        <Pagination current={page} pageSize={pageSize} total={total} showSizeChanger={false} onChange={onPageChange} />
      </Flex>
    </Spin>
  )
}
