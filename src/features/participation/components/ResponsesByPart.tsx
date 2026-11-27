import { Flex, Typography } from 'antd'
import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import { paths } from '@/app/router/paths'
import { Icon, inVoicePart, VoicePartIcon, voicePartName, voiceParts } from '@/shared/ui'
import { colors, spacing, typography } from '@/styles/tokens'
import type { ParticipationRequest } from '../types'

interface PartCount {
  label: string
  total: number
  confirmed: number
  declined: number
  /** Unsure or not answered yet. */
  open: number
}

const muted = { color: colors.textMuted, fontSize: typography.metadata.fontSize }

/** Requests counted per voice part; a member with no voice-part skill is in none. */
function countByPart(requests: ParticipationRequest[], skillsOf: Map<string, string[]>): PartCount[] {
  return voiceParts.map(({ label, pattern }) => {
    const inPart = requests.filter((request) => inVoicePart(skillsOf.get(request.memberId) ?? [], pattern))
    const confirmed = inPart.filter((request) => request.response === 'confirmed').length
    const declined = inPart.filter((request) => request.response === 'declined').length
    return { label, total: inPart.length, confirmed, declined, open: inPart.length - confirmed - declined }
  })
}

/**
 * Answers per voice part beside the list (artifact ParticipationPage): confirmed solid, declined hatched, the rest grey,
 * each with its count in words; then the part with the fewest confirmations so far, with a way to the roster. The part
 * comes from the members' approved skills: the backend's participation rows carry no voice part.
 */
export function ResponsesByPart({ requests, skillsOf, programId }: Readonly<{ requests: ParticipationRequest[]; skillsOf: Map<string, string[]>; programId: string }>) {
  const parts = countByPart(requests, skillsOf)
  const counted = parts.filter((part) => part.total > 0)
  const largest = Math.max(1, ...parts.map((part) => part.total))
  // The lowest share confirmed; ties go to the part with more still to answer.
  const weakest = counted.toSorted((a, b) => a.confirmed / a.total - b.confirmed / b.total || b.open - a.open)[0]

  return (
    <aside className="hm-preview" aria-label="Phản hồi theo bè">
      <p className="hm-rubric">Theo bè</p>
      {counted.length > 0 && (
        <Flex wrap gap={spacing.sm} style={{ ...muted, alignItems: 'center' }} aria-hidden>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span className="hm-part-legend__swatch is-confirmed" />
            Xác nhận
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span className="hm-part-legend__swatch is-declined" />
            Từ chối
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span className="hm-part-legend__swatch is-open" />
            Chưa rõ / chưa trả lời
          </span>
        </Flex>
      )}
      {counted.length === 0 ? (
        <Typography.Text style={muted}>Chưa có ca viên nào được mời có kỹ năng bè đã duyệt.</Typography.Text>
      ) : (
        <ul className="hm-part-bars">
          {parts.map((part, index) => (
            <li key={part.label}>
              <div className="hm-part-bars__head">
                <span>
                  <VoicePartIcon name={part.label} /> <b>{voicePartName(part.label)}</b>
                </span>
                <span style={muted}>
                  {part.total === 0 ? 'Chưa mời ai' : `${part.confirmed} xác nhận · ${part.declined} từ chối · ${part.open} chưa`}
                </span>
              </div>
              <div className="hm-part-bars__track mg-fill" aria-hidden style={{ '--i': index, width: `${(part.total / largest) * 100}%` } as CSSProperties}>
                {part.confirmed > 0 && <span className="is-confirmed" style={{ flex: part.confirmed }} />}
                {part.declined > 0 && <span className="is-declined" style={{ flex: part.declined }} />}
                {part.open > 0 && <span className="is-open" style={{ flex: part.open }} />}
              </div>
            </li>
          ))}
        </ul>
      )}
      {weakest && (
        <div className="hm-reading-note">
          <Typography.Text>
            Bè <b>{voicePartName(weakest.label)}</b> ít xác nhận nhất: {weakest.confirmed} trên {weakest.total} người được mời.
          </Typography.Text>
          <Link to={`${paths.director.roster}?programId=${programId}`}>
            Mở phân công <Icon name="arrow-right" />
          </Link>
        </div>
      )}
      <Typography.Text style={muted}>Bè lấy theo kỹ năng đã duyệt của ca viên; ca viên chưa có kỹ năng bè không được tính.</Typography.Text>
    </aside>
  )
}
