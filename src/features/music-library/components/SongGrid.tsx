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
    <Flex wrap gap={6}>
      {song.musicalKey && (
        <Tag variant="filled" style={{ marginInlineEnd: 0, background: colors.primarySoft, color: colors.primary, fontWeight: 600 }}>
          Giọng {song.musicalKey}
        </Tag>
      )}
      {song.tempo && <Tag style={{ marginInlineEnd: 0 }}>Nhịp {song.tempo}</Tag>}
    </Flex>
  )
}

/**
 * Library overview as song cards. The list endpoint returns song fields only, so classification and materials are
 * shown on the song page. The title is the card's link; it stretches over the card, so the whole card is clickable
 * and the link's name stays the song title.
 */
export function SongGrid({ songs, page, pageSize, total, loading, onPageChange }: Readonly<SongGridProps>) {
  const { search } = useLocation()
  return (
    <Spin spinning={!!loading}>
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
                <div style={{ background: 'linear-gradient(135deg, rgba(142,59,75,0.07), rgba(142,59,75,0.02))', padding: `${spacing.sm}px 0` }}>
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
                </Flex>
              </Card>
            </li>
          )
        })}
      </ul>
      {total > pageSize && (
        <Flex justify="flex-end" style={{ padding: `0 ${spacing.md}px ${spacing.md}px` }}>
          <Pagination current={page} pageSize={pageSize} total={total} showSizeChanger={false} onChange={onPageChange} />
        </Flex>
      )}
    </Spin>
  )
}
