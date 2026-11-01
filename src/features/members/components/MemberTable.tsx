import { Avatar, Button, Flex, Pagination, Spin, Typography } from 'antd'
import dayjs from 'dayjs'
import { StatusTag, type StatusTagColor } from '@/shared/ui'
import { colors, spacing, typography } from '@/styles/tokens'
import { memberStatusLabels, type MemberProfile, type MemberStatus } from '../types'

export interface MemberTableProps {
  members: MemberProfile[]
  /** Server-side paging of GET /api/member-profiles. */
  page: number
  pageSize: number
  total: number
  loading?: boolean
  onPageChange: (page: number) => void
  onEdit: (member: MemberProfile) => void
}

const muted = { color: colors.textMuted, fontSize: typography.metadata.fontSize }

// Preset tag colors; StatusTag darkens the text of the ones that are too pale to read.
const statusColors: Record<Exclude<MemberStatus, 'active'>, StatusTagColor> = { inactive: 'gold', left: 'default' }

/** A Vietnamese name ends with the given name: "Giuse Vũ Đình Khôi" → "K". */
const initial = (fullName: string) => fullName.trim().split(/\s+/).at(-1)?.charAt(0).toUpperCase() ?? ''

/**
 * The choir as people (brief 2026-10-31), one line each: initial, name, the skills approved for them in words, since
 * when they sing and how to reach them. Only a member who is not active carries a status, in words.
 */
export function MemberTable({ members, page, pageSize, total, loading, onPageChange, onEdit }: Readonly<MemberTableProps>) {
  return (
    <Spin spinning={loading}>
      {/* role="list": the list-style reset drops list semantics in Safari. */}
      <ul role="list" aria-label="Danh sách ca viên" className="hm-stagger" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {members.map((member) => (
          <li
            key={member.id}
            style={{ display: 'flex', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderTop: `1px solid ${colors.border}` }}
          >
            {/* Neutral: burgundy belongs to the brand and the liturgy, not to member data. */}
            <Avatar aria-hidden size={40} style={{ flexShrink: 0, background: colors.softSurface, color: colors.textBody, fontWeight: 600 }}>
              {initial(member.fullName)}
            </Avatar>
            <Flex vertical style={{ flex: 1, minWidth: 0 }}>
              <Flex align="center" gap={spacing.sm} wrap>
                <Typography.Text style={{ fontWeight: 600, fontSize: typography.cardHeading.fontSize }}>{member.fullName}</Typography.Text>
                {member.status !== 'active' && (
                  <StatusTag color={statusColors[member.status]} style={{ marginInlineEnd: 0 }}>
                    {memberStatusLabels[member.status]}
                  </StatusTag>
                )}
              </Flex>
              <Typography.Text style={{ color: member.skills.length > 0 ? colors.textBody : colors.textMuted }}>
                {member.skills.length > 0 ? member.skills.join(' · ') : 'Chưa có kỹ năng được duyệt'}
              </Typography.Text>
              <Typography.Text style={muted}>
                {[`Tham gia ${dayjs(member.joinedDate).format('DD/MM/YYYY')}`, member.email, member.phone].filter(Boolean).join(' · ')}
              </Typography.Text>
            </Flex>
            <Button onClick={() => onEdit(member)} aria-label={`Sửa ${member.fullName}`}>
              Sửa
            </Button>
          </li>
        ))}
      </ul>
      {total > pageSize && (
        <Flex justify="end" style={{ padding: spacing.md }}>
          <Pagination current={page} pageSize={pageSize} total={total} showSizeChanger={false} onChange={onPageChange} />
        </Flex>
      )}
    </Spin>
  )
}
