import { Descriptions, Flex, Switch, Table, Typography } from 'antd'
import { useState } from 'react'
import { EmptyCell, StatusTag, ViewDrawer, type StatusTagColor } from '@/shared/ui'
import { colors, component, spacing, typography } from '@/styles/tokens'
import { fieldLabel, fieldValue } from '../activityFields'
import { actionLabel, actorName, entityLabel } from '../activityFilters'
import { formatDateTime } from '@/lib/api/dates'
import type { ActivityRecord } from '../types'

export interface ActivityDetailDrawerProps {
  /** Record shown; the drawer is open while set. */
  record?: ActivityRecord
  onClose: () => void
}

interface FieldChange {
  field: string
  before?: string
  after?: string
  changed: boolean
}

const muted = { color: colors.textMuted }

const actionColors: Record<string, StatusTagColor> = {
  Created: 'green',
  Updated: 'blue',
  Deleted: 'red',
  PasswordChanged: 'gold',
}

/** The fields of the old and new JSON objects, in words; a value that is not an object is shown under "Giá trị". */
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
  const before = parse(oldValue)
  const after = parse(newValue)
  return [...new Set([...Object.keys(before), ...Object.keys(after)])].map((field) => {
    const beforeVal = fieldValue(field, before[field])
    const afterVal = fieldValue(field, after[field])
    return {
      field,
      before: beforeVal,
      after: afterVal,
      changed: beforeVal !== afterVal,
    }
  })
}

/** Read-only detail of one recorded change, with its field values before and after. */
export function ActivityDetailDrawer({ record, onClose }: Readonly<ActivityDetailDrawerProps>) {
  const [onlyChanged, setOnlyChanged] = useState(false)
  const changes = record ? changesOf(record) : []
  const changedCount = changes.filter((item) => item.changed).length
  const hasMixedChanges = changedCount > 0 && changedCount < changes.length
  const shownChanges = onlyChanged && hasMixedChanges ? changes.filter((item) => item.changed) : changes

  return (
    <ViewDrawer
      open={Boolean(record)}
      title="Chi tiết hoạt động"
      onClose={() => {
        setOnlyChanged(false)
        onClose()
      }}
      size={component.drawer.lg}
      destroyOnHidden
    >
      {record && (
        <>
          <Descriptions
            className="hm-key-value"
            column={1}
            size="small"
            items={[
              { key: 'time', label: 'Thời gian', children: <span>{formatDateTime(record.createdAt)}</span> },
              {
                key: 'actor',
                label: 'Người thực hiện',
                children: record.user?.fullName && record.user.email ? `${actorName(record)} (${record.user.email})` : actorName(record),
              },
              {
                key: 'action',
                label: 'Loại thay đổi',
                children: (
                  <StatusTag color={actionColors[record.action] ?? 'default'} style={{ marginInlineEnd: 0 }}>
                    {actionLabel(record.action)}
                  </StatusTag>
                ),
              },
              { key: 'entity', label: 'Dữ liệu', children: entityLabel(record.entityType) },
              ...(record.entityId ? [{ key: 'entityId', label: 'Mã bản ghi', children: <span>{record.entityId}</span> }] : []),
              ...(record.ipAddress ? [{ key: 'ip', label: 'Địa chỉ IP', children: <span>{record.ipAddress}</span> }] : []),
            ]}
          />
          {changes.length > 0 ? (
            <>
              {hasMixedChanges && (
                <Flex align="center" justify="flex-end" gap={spacing.xs} style={{ marginTop: spacing.md }}>
                  <Switch size="small" checked={onlyChanged} onChange={setOnlyChanged} aria-label="Chỉ hiện trường thay đổi" />
                  <Typography.Text style={{ fontSize: typography.metadata.fontSize, color: colors.textMuted }}>
                    Chỉ hiện trường thay đổi ({changedCount}/{changes.length})
                  </Typography.Text>
                </Flex>
              )}
              <Table<FieldChange>
                rowKey="field"
                size="small"
                pagination={false}
                dataSource={shownChanges}
                rowClassName={(row) => (row.changed ? 'hm-diff-changed' : '')}
                scroll={{ x: 'max-content' }}
                style={{ marginTop: hasMixedChanges ? spacing.xs : spacing.md }}
                columns={[
                  {
                    key: 'field',
                    title: 'Trường',
                    dataIndex: 'field',
                    render: (field: string, row: FieldChange) => (
                      <Typography.Text strong={row.changed}>{fieldLabel(record.entityType, field)}</Typography.Text>
                    ),
                  },
                  { key: 'before', title: 'Trước', dataIndex: 'before', render: (value?: string) => value ?? <EmptyCell text="Không có" /> },
                  {
                    key: 'after',
                    title: 'Sau',
                    dataIndex: 'after',
                    render: (value?: string, row?: FieldChange) =>
                      value ? <Typography.Text strong={row?.changed}>{value}</Typography.Text> : <EmptyCell text="Không có" />,
                  },
                ]}
              />
            </>
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
    </ViewDrawer>
  )
}
