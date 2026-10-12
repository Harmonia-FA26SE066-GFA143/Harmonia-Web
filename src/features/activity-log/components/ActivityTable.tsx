import { EyeOutlined } from '@ant-design/icons'
import { Button, Flex, Table, Tag, Typography, type TableColumnsType, type TablePaginationConfig } from 'antd'
import { colors, typography } from '@/styles/tokens'
import { actionLabel, actorName, entityLabel, formatActivityTime } from '../activityFilters'
import type { ActivityRecord } from '../types'

export interface ActivityTableProps {
  records: ActivityRecord[]
  /** Opens the detail view; the detail column is hidden when omitted. */
  onShowDetail?: (record: ActivityRecord) => void
  /** Filters the log by the person; names are plain text when omitted. */
  onPickUser?: (user: { id: string; name: string }) => void
  /** Server-side paging; none when omitted. */
  pagination?: TablePaginationConfig
  loading?: boolean
}

const muted = { color: colors.textMuted, fontSize: typography.metadata.fontSize }

/** Read-only list of recorded changes (FE-54), newest first. */
export function ActivityTable({ records, onShowDetail, onPickUser, pagination, loading }: ActivityTableProps) {
  const columns: TableColumnsType<ActivityRecord> = [
    {
      key: 'time',
      title: 'Thời gian',
      render: (_, record) => (
        <Typography.Text style={{ fontFamily: typography.fontFamilyNumeric, whiteSpace: 'nowrap' }}>
          {formatActivityTime(record.createdAt)}
        </Typography.Text>
      ),
    },
    {
      key: 'actor',
      title: 'Người thực hiện',
      render: (_, record) => {
        const name = actorName(record)
        const { user } = record
        return (
          <Flex vertical align="flex-start">
            {user && onPickUser ? (
              <Button
                type="link"
                size="small"
                onClick={() => onPickUser({ id: user.id, name })}
                aria-label={`Chỉ xem hoạt động của ${name}`}
                style={{ padding: 0, height: 'auto', fontWeight: 600 }}
              >
                {name}
              </Button>
            ) : (
              <Typography.Text strong={Boolean(user)} style={user ? undefined : muted}>
                {name}
              </Typography.Text>
            )}
            {user?.fullName && user.email && <Typography.Text style={muted}>{user.email}</Typography.Text>}
          </Flex>
        )
      },
    },
    {
      key: 'action',
      title: 'Thao tác',
      render: (_, record) => <Tag style={{ marginInlineEnd: 0 }}>{actionLabel(record.action)}</Tag>,
    },
    { key: 'entity', title: 'Dữ liệu', render: (_, record) => entityLabel(record.entityType) },
    ...(onShowDetail
      ? [
          {
            key: 'detail',
            title: 'Chi tiết',
            align: 'right' as const,
            render: (_: unknown, record: ActivityRecord) => (
              <Button
                icon={<EyeOutlined />}
                onClick={() => onShowDetail(record)}
                aria-label={`Xem chi tiết: ${actionLabel(record.action)} ${entityLabel(record.entityType)} lúc ${formatActivityTime(record.createdAt)}`}
              >
                Xem
              </Button>
            ),
          },
        ]
      : []),
  ]

  return (
    <Table<ActivityRecord>
      rowKey="id"
      columns={columns}
      dataSource={records}
      loading={loading}
      pagination={pagination ?? false}
      scroll={{ x: 'max-content' }}
    />
  )
}
