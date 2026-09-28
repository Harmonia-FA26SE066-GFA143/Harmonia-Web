import { Button, Flex, Table, Tag, Typography, type TableColumnsType } from 'antd'
import { colors } from '@/styles/tokens'
import { materialKindLabels, materialKinds, type Song } from '../types'

export interface SongTableProps {
  songs: Song[]
  onOpen: (song: Song) => void
}

const muted = <Typography.Text style={{ color: colors.textMuted }}>—</Typography.Text>

/** Library overview: title, classification, requirements and which material kinds are available. */
export function SongTable({ songs, onOpen }: SongTableProps) {
  const columns: TableColumnsType<Song> = [
    { key: 'title', title: 'Tên bài hát', render: (_, song) => <Typography.Text strong>{song.title}</Typography.Text> },
    {
      key: 'classification',
      title: 'Phân loại',
      render: (_, song) => {
        const tags = [song.season?.name, song.massType?.name, song.ceremonyType?.name, song.theme].filter(Boolean)
        return tags.length ? (
          <Flex wrap gap={4}>
            {tags.map((tag) => (
              <Tag key={tag} style={{ marginInlineEnd: 0 }}>
                {tag}
              </Tag>
            ))}
          </Flex>
        ) : (
          <Typography.Text style={{ color: colors.textMuted }}>Chưa phân loại</Typography.Text>
        )
      },
    },
    { key: 'vocal', title: 'Bè giọng', render: (_, song) => song.vocalRequirements || muted },
    { key: 'instrument', title: 'Nhạc cụ', render: (_, song) => song.instrumentRequirements || muted },
    {
      key: 'materials',
      title: 'Tài liệu',
      render: (_, song) =>
        song.availableMaterials.length ? (
          <Flex wrap gap={4}>
            {materialKinds
              .filter((kind) => song.availableMaterials.includes(kind))
              .map((kind) => (
                <Tag key={kind} color="default" style={{ marginInlineEnd: 0 }}>
                  {materialKindLabels[kind]}
                </Tag>
              ))}
          </Flex>
        ) : (
          <Typography.Text style={{ color: colors.textMuted }}>Chưa có</Typography.Text>
        ),
    },
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
      pagination={{ pageSize: 10, hideOnSinglePage: true }}
      // A fixed minimum width lets long classification and requirement cells wrap on desktop.
      scroll={{ x: 880 }}
    />
  )
}
