import { Table, Typography, type TableColumnsType } from 'antd'
import { colors, typography } from '@/styles/tokens'
import type { SongListItem } from '../types'

const muted = { color: colors.textMuted }

/** The songs of a list in display order, read-only: the Priest decides on the whole list. */
export function SongListItemsTable({ items }: { items: SongListItem[] }) {
  const columns: TableColumnsType<SongListItem> = [
    {
      key: 'order',
      title: 'Thứ tự',
      width: 72,
      render: (_, __, index) => (
        <Typography.Text style={{ ...muted, fontFamily: typography.fontFamilyNumeric }}>
          {String(index + 1).padStart(2, '0')}
        </Typography.Text>
      ),
    },
    { key: 'slot', title: 'Phần phụng vụ', dataIndex: 'slotName' },
    {
      key: 'song',
      title: 'Bài hát',
      dataIndex: 'songTitle',
      render: (songTitle: string) => <Typography.Text strong>{songTitle}</Typography.Text>,
    },
    {
      key: 'note',
      title: 'Ghi chú của Ca trưởng',
      dataIndex: 'note',
      render: (note?: string) => note || <Typography.Text style={muted}>—</Typography.Text>,
    },
  ]

  return <Table<SongListItem> rowKey="id" columns={columns} dataSource={items} pagination={false} scroll={{ x: 'max-content' }} />
}
