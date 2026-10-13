import { Button, Table, Typography, type TableColumnsType } from 'antd'
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
  onOpen: (song: Song) => void
}

const muted = <Typography.Text style={{ color: colors.textMuted }}>—</Typography.Text>

/**
 * Library overview. The list endpoint returns song fields only, so classification and materials are shown on the
 * song page rather than here.
 */
export function SongTable({ songs, page, pageSize, total, loading, onPageChange, onOpen }: Readonly<SongTableProps>) {
  const { search } = useLocation()
  const columns: TableColumnsType<Song> = [
    {
      key: 'title',
      title: 'Tên bài hát',
      // A link as well as the button: it opens in a new tab and shows where it goes.
      render: (_, song) => (
        <Link
          to={generatePath(paths.director.songDetail, { songId: song.id })}
          state={songListState(search)}
          style={{ fontWeight: 600 }}
        >
          {song.title}
        </Link>
      ),
    },
    { key: 'composer', title: 'Nhạc sĩ', render: (_, song) => song.composer || muted },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'right',
      render: (_, song) => (
        <Button onClick={() => onOpen(song)} aria-label={`Xem chi tiết ${song.title}`}>
          Xem
        </Button>
      ),
    },
  ]

  return (
    <Table<Song>
      rowKey="id"
      columns={columns}
      dataSource={songs}
      loading={loading}
      pagination={{ current: page, pageSize, total, hideOnSinglePage: true, showSizeChanger: false, onChange: onPageChange }}
    />
  )
}
