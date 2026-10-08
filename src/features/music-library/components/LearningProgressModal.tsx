import { Flex, Modal, Segmented, Table, Tag, Typography, type TableColumnsType } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import { parseUtc } from '@/lib/api/dates'
import { EmptyState, ErrorState } from '@/shared/ui'
import { colors, spacing, typography } from '@/styles/tokens'
import { useLearningProgress } from '../hooks/useSongs'
import { learningStatusLabels, learningStatuses, type LearningProgress, type LearningStatus, type SongMaterial } from '../types'

export interface LearningProgressModalProps {
  /** The material whose progress is shown; the modal is closed without one. */
  material?: SongMaterial
  onClose: () => void
}

const pageSize = 20

// Semantic colors keep Ant Design defaults (no approved values yet); the label always carries the meaning.
const statusColors: Record<LearningStatus, string> = { notStarted: 'default', needsPractice: 'gold', learned: 'green' }

function ProgressList({ material }: { material: SongMaterial }) {
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
        <Tag color={statusColors[value]} style={{ marginInlineEnd: 0 }}>
          {learningStatusLabels[value]}
        </Tag>
      ),
    },
    {
      key: 'updatedAt',
      title: 'Cập nhật',
      dataIndex: 'updatedAt',
      render: (updatedAt: string | null) =>
        updatedAt ? (
          <Typography.Text style={{ fontFamily: typography.fontFamilyNumeric }}>
            {dayjs(parseUtc(updatedAt)).format('DD/MM/YYYY HH:mm')}
          </Typography.Text>
        ) : (
          <Typography.Text style={{ color: colors.textMuted }}>—</Typography.Text>
        ),
    },
  ]

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
      {progress.isError ? (
        <ErrorState title="Không thể tải tiến độ học" onRetry={() => progress.refetch()} retrying={progress.isFetching} />
      ) : progress.isSuccess && progress.data.totalCount === 0 ? (
        <EmptyState title={status === 'all' ? 'Chưa có ca viên nào cần học tài liệu này' : 'Không có ca viên ở tình trạng này'} />
      ) : (
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
export function LearningProgressModal({ material, onClose }: LearningProgressModalProps) {
  return (
    <Modal
      open={Boolean(material)}
      title={material ? `Tiến độ học: ${material.title}` : undefined}
      footer={null}
      onCancel={onClose}
      width={640}
      destroyOnHidden
    >
      {material && <ProgressList material={material} />}
    </Modal>
  )
}
