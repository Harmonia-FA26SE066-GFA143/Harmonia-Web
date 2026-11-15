import { roleLabels } from '@/shared/types/account'
import { Avatar, Button, Flex, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { StatusTag, type StatusTagProps } from '@/shared/ui'
import { colors, spacing, typography } from '@/styles/tokens'
import { memberStatusLabels, type MemberProfile, type MemberStatus } from '../types'
import { personName } from '@/shared/utils/personName'

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

const muted = { display: 'block', color: colors.textMuted, fontSize: typography.metadata.fontSize }

// Artifact MembersPage: active filled, on leave dashed, left struck through.
const statusMarks: Record<MemberStatus, Pick<StatusTagProps, 'color' | 'mark'>> = {
  active: { color: 'green' },
  inactive: { mark: 'draft' },
  left: { mark: 'struck' },
}

/** Initials as the artifact draws them: first and last word, "Maria Nguyễn Thị Lan" → "ML". */
const initials = (fullName: string) => {
  const words = fullName.trim().split(/\s+/)
  return ((words[0]?.charAt(0) ?? '') + (words.length > 1 ? words.at(-1)!.charAt(0) : '')).toUpperCase()
}

/** The choir as a dense table (artifact MembersPage): who, how to reach them, approved skills, since when, status. */
export function MemberTable({ members, page, pageSize, total, loading, onPageChange, onEdit }: Readonly<MemberTableProps>) {
  const columns: ColumnsType<MemberProfile> = [
    {
      title: 'Ca viên',
      key: 'name',
      render: (_, member) => (
        <Flex align="center" gap={spacing.sm}>
          {/* Neutral: burgundy belongs to the brand and the liturgy, not to member data. */}
          <Avatar aria-hidden size={32} src={member.avatarUrl} style={{ flexShrink: 0, background: colors.softSurface, color: colors.textBody, fontWeight: 600, fontSize: 12 }}>
            {initials(member.fullName)}
          </Avatar>
          <Typography.Text style={{ fontWeight: 600 }}>{personName(member.fullName, member.saintName)}</Typography.Text>
        </Flex>
      ),
    },
    {
      title: 'Liên hệ',
      key: 'contact',
      render: (_, member) => (
        <>
          {member.email}
          <Typography.Text style={muted}>{member.phone || '—'}</Typography.Text>
        </>
      ),
    },
    {
      title: 'Kỹ năng',
      key: 'skills',
      render: (_, member) =>
        member.skills.length > 0 ? (
          <Flex wrap gap={4}>
            {member.skills.map((skill) => (
              <Tag key={skill} style={{ marginInlineEnd: 0 }}>
                {skill}
              </Tag>
            ))}
          </Flex>
        ) : (
          // Only a current Choir Member declares skills; on a retained profile the empty state says nothing (B46).
          member.role === 'member' && <Typography.Text style={{ color: colors.textMuted }}>Chưa có kỹ năng được duyệt</Typography.Text>
        ),
    },
    { title: 'Tham gia từ', dataIndex: 'joinedDate', render: (date: string) => dayjs(date).format('MM/YYYY') },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, member) =>
        member.role !== 'member' ? (
          <StatusTag style={{ marginInlineEnd: 0 }}>Đã chuyển sang {roleLabels[member.role]}</StatusTag>
        ) : (
          <StatusTag {...statusMarks[member.status]} style={{ marginInlineEnd: 0 }}>
            {memberStatusLabels[member.status]}
          </StatusTag>
        ),
    },
    {
      key: 'action',
      align: 'right',
      // A profile kept from an account that changed role is history only (BE 9b1f587: 409 MEMBER_NOT_ACTIVE).
      render: (_, member) =>
        member.role === 'member' && (
          <Button type="link" onClick={() => onEdit(member)} aria-label={`Hồ sơ của ${member.fullName}`}>
            Hồ sơ
          </Button>
        ),
    },
  ]

  return (
    <Table<MemberProfile>
      rowKey="id"
      aria-label="Danh sách ca viên"
      columns={columns}
      dataSource={members}
      loading={loading}
      pagination={total > pageSize && { current: page, pageSize, total, showSizeChanger: false, onChange: onPageChange }}
    />
  )
}
