import { DashboardOutlined, EditOutlined, UserOutlined } from '@ant-design/icons'
import { Flex, Typography } from 'antd'
import type { ReactNode } from 'react'
import { IconTile } from '@/shared/ui'
import { colors, radius, spacing, typography } from '@/styles/tokens'
import type { Song } from '../types'
import { StaffMotif } from './StaffMotif'

const none = <Typography.Text style={{ color: colors.textMuted, fontWeight: 400 }}>Chưa ghi</Typography.Text>

function Fact({ icon, label, value }: Readonly<{ icon: ReactNode; label: string; value: string | null }>) {
  return (
    <Flex align="center" gap={spacing.sm} style={{ flex: '1 1 180px', minWidth: 0 }}>
      <IconTile size={38}>{icon}</IconTile>
      <dl style={{ margin: 0, minWidth: 0 }}>
        <dt style={{ color: colors.textMuted, fontSize: typography.metadata.fontSize }}>{label}</dt>
        <dd style={{ margin: 0, fontWeight: 600 }}>{value || none}</dd>
      </dl>
    </Flex>
  )
}

/**
 * Song fields of GET /api/songs/{id}, laid out like the head of a score: the musical key large beside a staff, then
 * tempo and credits. The "Thông tin" tab of the song page.
 */
export function SongInfoPanel({ song }: Readonly<{ song: Song }>) {
  return (
    <Flex vertical gap={spacing.lg}>
        <Flex
          align="center"
          gap={spacing.lg}
          style={{
            padding: `${spacing.sm}px ${spacing.md}px`,
            borderRadius: radius.lg,
            background: 'rgba(142, 59, 75, 0.05)',
          }}
        >
          <Flex vertical align="center" style={{ flexShrink: 0, minWidth: 72 }}>
            <Typography.Text style={{ color: colors.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Giọng
            </Typography.Text>
            <Typography.Text style={{ fontSize: song.musicalKey ? 26 : 15, fontWeight: 600, color: song.musicalKey ? colors.primary : colors.textMuted, lineHeight: 1.2 }}>
              {song.musicalKey || 'Chưa ghi'}
            </Typography.Text>
          </Flex>
          <div style={{ flex: 1, minWidth: 0 }}>
            <StaffMotif seed={song.id} height={64} />
          </div>
        </Flex>
        <Flex wrap gap={spacing.md}>
          <Fact icon={<DashboardOutlined />} label="Nhịp độ" value={song.tempo} />
          <Fact icon={<UserOutlined />} label="Nhạc sĩ" value={song.composer} />
          <Fact icon={<EditOutlined />} label="Người viết lời" value={song.lyricist} />
        </Flex>
        {song.notes && (
          <div style={{ paddingTop: spacing.md, borderTop: `1px solid ${colors.border}` }}>
            <Typography.Text style={{ color: colors.textMuted, fontSize: typography.metadata.fontSize }}>Ghi chú</Typography.Text>
            <Typography.Paragraph style={{ margin: 0, whiteSpace: 'pre-line' }}>{song.notes}</Typography.Paragraph>
          </div>
        )}
    </Flex>
  )
}
