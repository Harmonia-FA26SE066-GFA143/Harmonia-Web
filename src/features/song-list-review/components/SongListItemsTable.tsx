import { FolderOpenOutlined } from '@ant-design/icons'
import { Button, Table, Typography, type TableColumnsType } from 'antd'
import { useState } from 'react'
import { colors } from '@/styles/tokens'
import type { SongListItem } from '../types'
import { SongMaterialsDrawer } from './SongMaterialsDrawer'

const muted = { color: colors.textMuted }

/** The songs of a list in display order, read-only: the Priest decides on the whole list, after opening its materials. */
export function SongListItemsTable({ items }: Readonly<{ items: SongListItem[] }>) {
  const [viewing, setViewing] = useState<SongListItem>()
  const columns: TableColumnsType<SongListItem> = [
    {
      key: 'order',
      title: 'Thứ tự',
      width: 72,
      render: (_, __, index) => (
        <Typography.Text style={{ ...muted, fontVariantNumeric: 'tabular-nums' }}>
          {index + 1}
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
    {
      key: 'materials',
      title: 'Tài liệu',
      render: (_, item) => (
        <Button icon={<FolderOpenOutlined />} onClick={() => setViewing(item)} aria-label={`Xem tài liệu của ${item.songTitle}`}>
          Xem tài liệu
        </Button>
      ),
    },
  ]

  return (
    <>
      <Table<SongListItem> rowKey="id" columns={columns} dataSource={items} pagination={false} scroll={{ x: 'max-content' }} />
      <SongMaterialsDrawer item={viewing} onClose={() => setViewing(undefined)} />
    </>
  )
}
