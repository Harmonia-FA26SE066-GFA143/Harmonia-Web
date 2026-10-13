import { Button, Descriptions, Modal, Table, Typography } from 'antd'
import { colors, spacing, typography } from '@/styles/tokens'
import { actionLabel, actorName, entityLabel, formatActivityTime } from '../activityFilters'
import type { ActivityRecord } from '../types'

export interface ActivityDetailModalProps {
  /** Record shown; the modal is open while set. */
  record?: ActivityRecord
  onClose: () => void
}

interface FieldChange {
  field: string
  before?: string
  after?: string
}

const muted = { color: colors.textMuted }
const mono = { fontFamily: typography.fontFamilyNumeric }

/** The fields of the old and new JSON objects; a value that is not an object is shown under "Giá trị". */
function changesOf({ oldValue, newValue }: ActivityRecord): FieldChange[] {
  const parse = (json?: string): Record<string, unknown> => {
    if (!json) return {}
    try {
      const value: unknown = JSON.parse(json)
      return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : { 'Giá trị': value }
    } catch {
      return { 'Giá trị': json }
    }
  }
  const text = (value: unknown) => (value === undefined ? undefined : typeof value === 'string' ? value : JSON.stringify(value))
  const before = parse(oldValue)
  const after = parse(newValue)
  return [...new Set([...Object.keys(before), ...Object.keys(after)])].map((field) => ({
    field,
    before: text(before[field]),
    after: text(after[field]),
  }))
}

/** Read-only detail of one recorded change, with its field values before and after. */
export function ActivityDetailModal({ record, onClose }: Readonly<ActivityDetailModalProps>) {
  const changes = record ? changesOf(record) : []

  return (
    <Modal
      open={Boolean(record)}
      title="Chi tiết hoạt động"
      onCancel={onClose}
      footer={<Button onClick={onClose}>Đóng</Button>}
      width={720}
      destroyOnHidden
    >
      {record && (
        <>
          <Descriptions
            column={1}
            size="small"
            items={[
              { key: 'time', label: 'Thời gian', children: <span style={mono}>{formatActivityTime(record.createdAt)}</span> },
              {
                key: 'actor',
                label: 'Người thực hiện',
                children: record.user?.fullName && record.user.email ? `${actorName(record)} (${record.user.email})` : actorName(record),
              },
              { key: 'action', label: 'Thao tác', children: actionLabel(record.action) },
              { key: 'entity', label: 'Dữ liệu', children: entityLabel(record.entityType) },
              ...(record.entityId ? [{ key: 'entityId', label: 'Mã bản ghi', children: <span style={mono}>{record.entityId}</span> }] : []),
              ...(record.ipAddress ? [{ key: 'ip', label: 'Địa chỉ IP', children: <span style={mono}>{record.ipAddress}</span> }] : []),
            ]}
          />
          {changes.length > 0 ? (
            <Table<FieldChange>
              rowKey="field"
              size="small"
              pagination={false}
              dataSource={changes}
              scroll={{ x: 'max-content' }}
              style={{ marginTop: spacing.md }}
              columns={[
                { key: 'field', title: 'Trường', dataIndex: 'field', render: (field: string) => <span style={mono}>{field}</span> },
                { key: 'before', title: 'Trước', dataIndex: 'before', render: (value?: string) => value ?? <span style={muted}>—</span> },
                { key: 'after', title: 'Sau', dataIndex: 'after', render: (value?: string) => value ?? <span style={muted}>—</span> },
              ]}
            />
          ) : (
            <Typography.Paragraph style={{ margin: `${spacing.md}px 0 0`, ...muted }}>
              Không có giá trị nào được ghi cho thao tác này.
            </Typography.Paragraph>
          )}
          <Typography.Paragraph style={{ margin: `${spacing.md}px 0 0`, ...muted }}>
            Bản ghi được hệ thống tự động lưu và không thể chỉnh sửa.
          </Typography.Paragraph>
        </>
      )}
    </Modal>
  )
}
