import { EyeOutlined } from '@ant-design/icons'
import { Button, Flex, Table, Tag, Typography, type TableColumnsType } from 'antd'
import { roleLabels } from '@/shared/types/account'
import { colors, typography } from '@/styles/tokens'
import { formatActivityTime } from '../activityFilters'
import { activityTypeLabels, type ActivityRecord } from '../types'

export interface ActivityTableProps {
  records: ActivityRecord[]
  /** Opens the detail view; the detail column is hidden when omitted. */
  onShowDetail?: (record: ActivityRecord) => void
  /** Rows per page; pagination is hidden when all rows fit. */
  pageSize?: number
}

const muted = { color: colors.textMuted, fontSize: typography.metadata.fontSize }

/**
 * Read-only list of recorded activities (FE-54). No outcome/status column: Stitch's "Thành công / Hoàn tất /
 * Đã ghi nhận …" labels are not approved statuses.
 */
export function ActivityTable({ records, onShowDetail, pageSize = 10 }: ActivityTableProps) {
  const columns: TableColumnsType<ActivityRecord> = [
    {
      key: 'time',
      title: 'Thời gian',
      render: (_, record) => (
        <Typography.Text style={{ fontFamily: typography.fontFamilyNumeric, whiteSpace: 'nowrap' }}>
          {formatActivityTime(record.occurredAt)}
        </Typography.Text>
      ),
    },
    {
      key: 'actor',
      title: 'Người thực hiện',
      render: (_, record) => (
        <Flex vertical>
          <Typography.Text strong>{record.actorName}</Typography.Text>
          {record.actorRole && <Typography.Text style={muted}>{roleLabels[record.actorRole]}</Typography.Text>}
        </Flex>
      ),
    },
    {
      key: 'type',
      title: 'Hoạt động',
      render: (_, record) => <Tag style={{ marginInlineEnd: 0 }}>{activityTypeLabels[record.type]}</Tag>,
    },
    { key: 'target', title: 'Đối tượng', dataIndex: 'target' },
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
                aria-label={`Xem chi tiết: ${activityTypeLabels[record.type]} – ${record.target}`}
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
      pagination={{ pageSize, hideOnSinglePage: true }}
      scroll={{ x: 'max-content' }}
    />
  )
}
