import { Card, Descriptions, Typography } from 'antd'
import { colors } from '@/styles/tokens'
import type { Song } from '../types'

const orNone = (value: string | null) =>
  value || <Typography.Text style={{ color: colors.textMuted }}>—</Typography.Text>

/** Song fields of GET /api/songs/{id}. */
export function SongInfoCard({ song }: { song: Song }) {
  return (
    <Card title="Thông tin bài hát">
      <Descriptions
        layout="vertical"
        colon={false}
        column={{ xs: 1, sm: 2, lg: 4 }}
        items={[
          { key: 'composer', label: 'Nhạc sĩ', children: orNone(song.composer) },
          { key: 'lyricist', label: 'Người viết lời', children: orNone(song.lyricist) },
          { key: 'musicalKey', label: 'Giọng (tone)', children: orNone(song.musicalKey) },
          { key: 'tempo', label: 'Nhịp độ', children: orNone(song.tempo) },
          {
            key: 'notes',
            label: 'Ghi chú',
            span: 'filled',
            children: song.notes ? (
              <Typography.Paragraph style={{ margin: 0, whiteSpace: 'pre-line' }}>{song.notes}</Typography.Paragraph>
            ) : (
              orNone(null)
            ),
          },
        ]}
      />
    </Card>
  )
}
