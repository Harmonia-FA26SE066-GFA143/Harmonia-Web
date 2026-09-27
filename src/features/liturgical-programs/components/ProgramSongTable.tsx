import { Table, Typography, type TableColumnsType } from 'antd'
import { colors, typography } from '@/styles/tokens'
import type { ProgramSong } from '../types'

/**
 * Songs of a program's current song list, in order. No per-song review status: whether decisions apply to each
 * song or to the whole list is UNRESOLVED (song-approval.md).
 */
export function ProgramSongTable({ songs }: { songs: ProgramSong[] }) {
  const columns: TableColumnsType<ProgramSong> = [
    {
      key: 'order',
      title: 'STT',
      width: 72,
      render: (_, song) => (
        <Typography.Text style={{ fontFamily: typography.fontFamilyNumeric, color: colors.textMuted }}>
          {String(songs.indexOf(song) + 1).padStart(2, '0')}
        </Typography.Text>
      ),
    },
    {
      key: 'part',
      title: 'Phần phụng vụ',
      render: (_, song) => song.liturgicalPart || <Typography.Text style={{ color: colors.textMuted }}>—</Typography.Text>,
    },
    { key: 'title', title: 'Tên bài hát', render: (_, song) => <Typography.Text strong>{song.title}</Typography.Text> },
  ]

  return (
    <Table<ProgramSong> rowKey="id" columns={columns} dataSource={songs} pagination={false} scroll={{ x: 'max-content' }} />
  )
}
