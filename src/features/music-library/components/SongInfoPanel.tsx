import { Typography } from 'antd'
import { colors, spacing, typography } from '@/styles/tokens'
import type { Song } from '../types'

const none = <span style={{ color: colors.textMuted, fontWeight: 400 }}>Chưa ghi</span>

/**
 * Song fields of GET /api/songs/{id} as one description list: label over value, four across, then the notes. The
 * "Thông tin" tab of the song page.
 */
export function SongInfoPanel({ song }: Readonly<{ song: Song }>) {
  const facts = [
    { label: 'Giọng', value: song.musicalKey },
    { label: 'Nhịp độ', value: song.tempo },
    { label: 'Nhạc sĩ', value: song.composer },
    { label: 'Người viết lời', value: song.lyricist },
  ]
  return (
    <div>
      <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: spacing.lg, margin: 0 }}>
        {facts.map(({ label, value }) => (
          <div key={label} style={{ minWidth: 0 }}>
            <dt style={{ color: colors.textMuted, fontSize: 13 }}>{label}</dt>
            <dd style={{ margin: '2px 0 0', fontWeight: 600 }}>{value || none}</dd>
          </div>
        ))}
      </dl>
      {song.notes && (
        <div style={{ marginTop: spacing.lg, paddingTop: spacing.md, borderTop: `1px solid ${colors.border}` }}>
          <Typography.Text style={{ color: colors.textMuted, fontSize: typography.metadata.fontSize }}>Ghi chú</Typography.Text>
          <Typography.Paragraph style={{ margin: 0, whiteSpace: 'pre-line' }}>{song.notes}</Typography.Paragraph>
        </div>
      )}
    </div>
  )
}
