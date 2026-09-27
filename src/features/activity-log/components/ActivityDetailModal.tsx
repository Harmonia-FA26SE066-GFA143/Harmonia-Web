import { Button, Descriptions, Modal, Typography } from 'antd'
import { roleLabels } from '@/shared/types/account'
import { colors, spacing, typography } from '@/styles/tokens'
import { formatActivityTime } from '../activityFilters'
import { activityTypeLabels, type ActivityRecord } from '../types'

export interface ActivityDetailModalProps {
  /** Record shown; the modal is open while set. */
  record?: ActivityRecord
  onClose: () => void
}

/** Read-only detail of one activity record. Records cannot be edited or deleted here. */
export function ActivityDetailModal({ record, onClose }: ActivityDetailModalProps) {
  return (
    <Modal
      open={Boolean(record)}
      title="Chi tiết hoạt động"
      onCancel={onClose}
      footer={<Button onClick={onClose}>Đóng</Button>}
      destroyOnHidden
    >
      {record && (
        <>
          <Descriptions
            column={1}
            size="small"
            items={[
              {
                key: 'time',
                label: 'Thời gian',
                children: (
                  <span style={{ fontFamily: typography.fontFamilyNumeric }}>
                    {formatActivityTime(record.occurredAt)}
                  </span>
                ),
              },
              {
                key: 'actor',
                label: 'Người thực hiện',
                children: record.actorRole
                  ? `${record.actorName} (${roleLabels[record.actorRole]})`
                  : record.actorName,
              },
              { key: 'type', label: 'Hoạt động', children: activityTypeLabels[record.type] },
              { key: 'target', label: 'Đối tượng', children: record.target },
              { key: 'details', label: 'Nội dung', children: record.details || 'Không có mô tả thêm.' },
            ]}
          />
          <Typography.Paragraph style={{ margin: `${spacing.md}px 0 0`, color: colors.textMuted }}>
            Bản ghi được hệ thống tự động lưu và không thể chỉnh sửa.
          </Typography.Paragraph>
        </>
      )}
    </Modal>
  )
}
