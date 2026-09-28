import { Card, Descriptions, Typography } from 'antd'
import { colors } from '@/styles/tokens'
import type { SongClassification } from '../types'

const orUnclassified = (value?: string) =>
  value || <Typography.Text style={{ color: colors.textMuted, fontStyle: 'italic' }}>Chưa phân loại</Typography.Text>

/** The six FE-29 classification dimensions of one song. */
export function SongClassificationCard({ song }: { song: SongClassification }) {
  return (
    <Card title="Phân loại">
      <Descriptions
        layout="vertical"
        colon={false}
        column={{ xs: 1, sm: 2, lg: 3 }}
        items={[
          { key: 'season', label: 'Mùa phụng vụ', children: orUnclassified(song.season?.name) },
          { key: 'massType', label: 'Loại Thánh lễ', children: orUnclassified(song.massType?.name) },
          { key: 'ceremonyType', label: 'Loại nghi thức', children: orUnclassified(song.ceremonyType?.name) },
          { key: 'theme', label: 'Chủ đề', children: orUnclassified(song.theme) },
          { key: 'vocal', label: 'Yêu cầu bè giọng', children: orUnclassified(song.vocalRequirements) },
          { key: 'instrument', label: 'Yêu cầu nhạc cụ', children: orUnclassified(song.instrumentRequirements) },
        ]}
      />
    </Card>
  )
}
