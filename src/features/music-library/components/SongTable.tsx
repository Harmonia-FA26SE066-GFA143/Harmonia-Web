import { Button, Table, Typography, type TableColumnsType } from 'antd'
import { colors } from '@/styles/tokens'
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
export function SongTable({ songs, page, pageSize, total, loading, onPageChange, onOpen }: SongTableProps) {
  const columns: TableColumnsType<Song> = [
    { key: 'title', title: 'Tên bài hát', render: (_, song) => <Typography.Text strong>{song.title}</Typography.Text> },
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
