import { Button, Flex, Table, Tag, Typography, type TableColumnsType } from 'antd'
import dayjs from 'dayjs'
import { colors, typography } from '@/styles/tokens'
import { memberStatusLabels, type MemberProfile, type MemberStatus } from '../types'
import { SkillTags } from './SkillTags'

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

// Semantic colors keep Ant Design defaults (no approved values yet); the label always carries the meaning.
const statusColors: Record<MemberStatus, string> = { active: 'green', inactive: 'gold', left: 'default' }

export function MemberTable({ members, page, pageSize, total, loading, onPageChange, onEdit }: MemberTableProps) {
  const columns: TableColumnsType<MemberProfile> = [
    {
      key: 'member',
      title: 'Ca viên',
      render: (_, member) => (
        <Flex vertical>
          <Typography.Text strong>{member.fullName}</Typography.Text>
          <Typography.Text style={muted}>{member.email}</Typography.Text>
          {member.phone && <Typography.Text style={muted}>{member.phone}</Typography.Text>}
        </Flex>
      ),
    },
    {
      key: 'skills',
      title: 'Kỹ năng đã duyệt',
      render: (_, member) => <SkillTags skills={member.skills} />,
    },
    {
      key: 'joinedDate',
      title: 'Ngày tham gia',
      dataIndex: 'joinedDate',
      render: (joinedDate: string) => (
        <Typography.Text style={{ fontFamily: typography.fontFamilyNumeric }}>
          {dayjs(joinedDate).format('DD/MM/YYYY')}
        </Typography.Text>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (status: MemberStatus) => (
        <Tag color={statusColors[status]} style={{ marginInlineEnd: 0 }}>
          {memberStatusLabels[status]}
        </Tag>
      ),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'right',
      render: (_, member) => (
        <Button onClick={() => onEdit(member)} aria-label={`Sửa ${member.fullName}`}>
          Sửa
        </Button>
      ),
    },
  ]

  return (
    <Table<MemberProfile>
      rowKey="id"
      columns={columns}
      dataSource={members}
      loading={loading}
      pagination={{ current: page, pageSize, total, hideOnSinglePage: true, showSizeChanger: false, onChange: onPageChange }}
      scroll={{ x: 'max-content' }}
    />
  )
}
