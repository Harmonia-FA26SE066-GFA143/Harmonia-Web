import { Table, Tag, Typography, type TableColumnsType } from 'antd'
import { generatePath, Link, useLocation } from 'react-router'
import { paths } from '@/app/router/paths'
import { colors } from '@/styles/tokens'
import { songListState } from '../songFilters'
import type { Song } from '../types'

export interface SongTableProps {
  songs: Song[]
  /** Server-side paging of GET /api/songs. */
  page: number
  pageSize: number
  total: number
  loading?: boolean
  onPageChange: (page: number) => void
}

const none = <span style={{ color: colors.textMuted }}>—</span>
const num = { fontVariantNumeric: 'tabular-nums' } as const

const materials = (song: Song) =>
  song.materialCounts ? Object.values(song.materialCounts).reduce((sum, count) => sum + count, 0) : undefined

/**
 * The music library as a table (2026-10-30): one row per song of GET /api/songs, its credits, key and tempo, how
 * often it served and how many materials it has (SongDto counts). The title links to the song page.
 */
export function SongTable({ songs, page, pageSize, total, loading, onPageChange }: Readonly<SongTableProps>) {
  const { search } = useLocation()
  const columns: TableColumnsType<Song> = [
    {
      title: 'Bài hát',
      key: 'title',
      render: (_, song) => (
        <Link
          to={generatePath(paths.director.songDetail, { songId: song.id })}
          state={songListState(search)}
          style={{ fontWeight: 600, color: colors.textPrimary }}
        >
          {song.title}
        </Link>
      ),
    },
    {
      title: 'Nhạc / Lời',
      key: 'credits',
      responsive: ['md'],
      render: (_, song) => {
        const credits = [song.composer, song.lyricist && song.lyricist !== song.composer && song.lyricist].filter(Boolean)
        return credits.length > 0 ? <Typography.Text style={{ color: colors.textBody }}>{credits.join(' / ')}</Typography.Text> : none
      },
    },
    { title: 'Giọng', key: 'key', width: 90, responsive: ['lg'], render: (_, song) => song.musicalKey || none },
    { title: 'Nhịp', key: 'tempo', width: 110, responsive: ['lg'], render: (_, song) => song.tempo || none },
    {
      title: 'Đã dùng',
      key: 'used',
      width: 100,
      align: 'right',
      responsive: ['md'],
      render: (_, song) => (song.timesUsed === undefined ? none : <span style={num}>{song.timesUsed}</span>),
    },
    {
      title: 'Tài liệu',
      key: 'materials',
      width: 100,
      align: 'right',
      responsive: ['lg'],
      render: (_, song) => {
        const count = materials(song)
        return count === undefined ? none : <span style={num}>{count}</span>
      },
    },
    {
      title: 'Phân loại',
      key: 'classified',
      width: 140,
      responsive: ['md'],
      // Only the songs that still need classifying carry a mark; the others stay quiet.
      render: (_, song) =>
        song.isClassified === false ? (
          <Tag color="warning" style={{ marginInlineEnd: 0 }}>
            Chưa phân loại
          </Tag>
        ) : null,
    },
  ]

  return (
    <Table<Song>
      rowKey="id"
      columns={columns}
      dataSource={songs}
      loading={loading}
      pagination={{ current: page, pageSize, total, showSizeChanger: false, onChange: onPageChange, hideOnSinglePage: false }}
    />
  )
}
