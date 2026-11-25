import { roleLabels } from '@/shared/types/account'
import { Avatar, Button, Flex, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { ACTIONS_COLUMN_TITLE, EDIT_MEMBER_ACTION, EmptyCell, StatusTag, VIEW_MEMBER_ACTION, type StatusTagProps } from '@/shared/ui'
import { colors, spacing, typography } from '@/styles/tokens'
import { memberStatusLabels, type MemberProfile, type MemberStatus } from '../types'
import { personName } from '@/shared/utils/personName'
import { VoicePartTags } from './SkillTags'
import { initials } from '../utils/initials'

export interface MemberTableProps {
  members: MemberProfile[]
  /** Server-side paging of GET /api/member-profiles. */
  page: number
  pageSize: number
  total: number
  loading?: boolean
  onPageChange: (page: number) => void
  onView: (member: MemberProfile) => void
  onEdit: (member: MemberProfile) => void
}

const muted = { display: 'block', color: colors.textMuted, fontSize: typography.metadata.fontSize }

// Artifact MembersPage: active filled, on leave dashed, left struck through.
const statusMarks: Record<MemberStatus, Pick<StatusTagProps, 'color' | 'mark'>> = {
  active: { color: 'green' },
  inactive: { mark: 'draft' },
  left: { mark: 'struck' },
}

/** The member's status, or the role a retained profile's account moved to (B46). */
export function MemberStatusTag({ member }: Readonly<{ member: MemberProfile }>) {
  return member.role === 'member' ? (
    <StatusTag {...statusMarks[member.status]} style={{ marginInlineEnd: 0 }}>
      {memberStatusLabels[member.status]}
    </StatusTag>
  ) : (
    <StatusTag style={{ marginInlineEnd: 0 }}>Đã chuyển sang {roleLabels[member.role]}</StatusTag>
  )
}

/** The choir as a dense table (artifact MembersPage): who, how to reach them, approved skills, since when, status. */
export function MemberTable({ members, page, pageSize, total, loading, onPageChange, onView, onEdit }: Readonly<MemberTableProps>) {
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
          <Typography.Text style={muted}>{member.phone || <EmptyCell />}</Typography.Text>
        </>
      ),
    },
    {
      title: 'Bè & Kỹ năng',
      key: 'skills',
      // Only a current Choir Member has a voice part to miss; a retained profile says nothing when empty (B46).
      render: (_, member) => <VoicePartTags skills={member.skills} showUnassigned={member.role === 'member'} />,
    },
    { title: 'Tham gia từ', dataIndex: 'joinedDate', render: (date: string) => dayjs(date).format('MM/YYYY') },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, member) => <MemberStatusTag member={member} />,
    },
    {
      key: 'action',
      title: ACTIONS_COLUMN_TITLE,
      align: 'center',
      width: 120,
      // Short verbs as in the program table; the full action and the member's name stay in the accessible name.
      render: (_, member) => (
        <Flex justify="center" gap={4}>
          <Button type="link" size="small" onClick={() => onView(member)} aria-label={`${VIEW_MEMBER_ACTION} ${member.fullName}`}>
            Xem
          </Button>
          {/* A profile kept from an account that changed role is history only (BE 9b1f587: 409 MEMBER_NOT_ACTIVE). */}
          {member.role === 'member' && (
            <Button type="link" size="small" onClick={() => onEdit(member)} aria-label={`${EDIT_MEMBER_ACTION} ${member.fullName}`}>
              Sửa
            </Button>
          )}
        </Flex>
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
