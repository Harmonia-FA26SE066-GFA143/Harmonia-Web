import { Drawer, Flex, Segmented, Table, Typography, type TableColumnsType } from 'antd'
import { useState } from 'react'
import { formatDateTime } from '@/lib/api/dates'
import { EmptyState, ErrorState, StatusTag, type StatusTagColor } from '@/shared/ui'
import { colors, spacing, typography } from '@/styles/tokens'
import { useLearningProgress } from '../hooks/useSongs'
import { learningStatusLabels, learningStatuses, type LearningProgress, type LearningStatus, type SongMaterial } from '../types'

export interface LearningProgressDrawerProps {
  /** The material whose progress is shown; the drawer is closed without one. */
  material?: SongMaterial
  onClose: () => void
}

const pageSize = 20

// Preset tag colors; StatusTag darkens the text of the ones that are too pale to read.
const statusColors: Record<LearningStatus, StatusTagColor> = { notStarted: 'default', needsPractice: 'gold', learned: 'green' }

function ProgressList({ material }: Readonly<{ material: SongMaterial }>) {
  const [status, setStatus] = useState<LearningStatus | 'all'>('all')
  const [page, setPage] = useState(1)
  const progress = useLearningProgress(material.id, status === 'all' ? undefined : status, { pageNumber: page, pageSize })

  const columns: TableColumnsType<LearningProgress> = [
    { key: 'name', title: 'Ca viên', dataIndex: 'fullName' },
    {
      key: 'status',
      title: 'Tình trạng',
      dataIndex: 'status',
      render: (value: LearningStatus) => (
        <StatusTag color={statusColors[value]} style={{ marginInlineEnd: 0 }}>
          {learningStatusLabels[value]}
        </StatusTag>
      ),
    },
    {
      key: 'updatedAt',
      title: 'Cập nhật',
      dataIndex: 'updatedAt',
      render: (updatedAt: string | null) =>
        updatedAt ? (
          <Typography.Text style={{ fontFamily: typography.fontFamilyNumeric }}>
            {formatDateTime(updatedAt)}
          </Typography.Text>
        ) : (
          <Typography.Text style={{ color: colors.textMuted }}>—</Typography.Text>
        ),
    },
  ]

  const empty = progress.data !== undefined && progress.data.totalCount === 0

  return (
    <Flex vertical gap={spacing.md}>
      <Typography.Text style={{ color: colors.textMuted }}>
        {material.targetSkillName
          ? `Ca viên đang sinh hoạt có kỹ năng ${material.targetSkillName} đã được duyệt.`
          : 'Mọi ca viên đang sinh hoạt.'}
      </Typography.Text>
      <Segmented<LearningStatus | 'all'>
        value={status}
        onChange={(value) => {
          setStatus(value)
          setPage(1)
        }}
        options={[
          { value: 'all', label: 'Tất cả' },
          ...learningStatuses.map((value) => ({ value, label: learningStatusLabels[value] })),
        ]}
      />
      {progress.isError && (
        <ErrorState title="Không thể tải tiến độ học" error={progress.error} hasData={progress.data !== undefined} onRetry={() => progress.refetch()} retrying={progress.isFetching} />
      )}
      {empty && (
        <EmptyState title={status === 'all' ? 'Chưa có ca viên nào cần học tài liệu này' : 'Không có ca viên ở tình trạng này'} />
      )}
      {!progress.isError && !empty && (
        <Table<LearningProgress>
          rowKey="memberId"
          size="small"
          columns={columns}
          dataSource={progress.data?.items}
          loading={progress.isPending || progress.isPlaceholderData}
          pagination={{
            current: page,
            pageSize,
            total: progress.data?.totalCount,
            hideOnSinglePage: true,
            showSizeChanger: false,
            onChange: setPage,
          }}
          scroll={{ x: 'max-content' }}
        />
      )}
    </Flex>
  )
}

/** Choir Director: who has learned a material, as members mark it in the mobile app (FE-09). */
export function LearningProgressDrawer({ material, onClose }: Readonly<LearningProgressDrawerProps>) {
  return (
    <Drawer open={Boolean(material)} title={material ? `Tiến độ học: ${material.title}` : undefined} onClose={onClose} size={640} destroyOnHidden>
      {material && <ProgressList material={material} />}
    </Drawer>
  )
}
