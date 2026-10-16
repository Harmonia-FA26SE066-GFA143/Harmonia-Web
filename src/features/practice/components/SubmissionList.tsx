import { Card, Flex, Segmented } from 'antd'
import { useState } from 'react'
import { EmptyState, ErrorState, SectionSkeleton } from '@/shared/ui'
import { spacing } from '@/styles/tokens'
import { useSubmissions } from '../hooks/usePractice'
import { practiceStatusLabels, practiceStatuses, type PracticeStatus } from '../types'
import { ReviewModal } from './ReviewModal'
import { SubmissionTable } from './SubmissionTable'

const pageSize = 20

export interface SubmissionListProps {
  /** Submissions of this assignment; absent for the review queue across every assignment. */
  assignmentId?: string
  defaultStatus: PracticeStatus | 'all'
}

/** Each member's newest attempt, filtered by status and paged on the server, reviewed in the review modal (FE-42). */
export function SubmissionList({ assignmentId, defaultStatus }: Readonly<SubmissionListProps>) {
  const [status, setStatus] = useState(defaultStatus)
  const [page, setPage] = useState(1)
  const [openId, setOpenId] = useState<string>()
  const submissions = useSubmissions(status === 'all' ? undefined : status, { pageNumber: page, pageSize }, assignmentId)
  const total = submissions.data?.totalCount ?? 0

  return (
    <Flex vertical gap={spacing.md}>
      <Segmented<PracticeStatus | 'all'>
        aria-label="Lọc bản thu theo trạng thái"
        value={status}
        onChange={(value) => {
          setStatus(value)
          setPage(1)
        }}
        options={[
          ...practiceStatuses.map((value) => ({ value, label: practiceStatusLabels[value] })),
          { value: 'all', label: 'Tất cả' },
        ]}
        style={{ alignSelf: 'flex-start', maxWidth: '100%', overflowX: 'auto' }}
      />
      {submissions.isPending && <SectionSkeleton rows={6} label="Đang tải bản thu" />}
      {submissions.isError && (
        <ErrorState title="Không thể tải bản thu" onRetry={() => submissions.refetch()} retrying={submissions.isFetching} />
      )}
      {submissions.isSuccess && total === 0 && (
        <EmptyState
          title={status === 'submitted' ? 'Không có bản thu nào chờ chấm' : 'Không có bản thu nào'}
          description="Ca viên nộp bản thu trên ứng dụng di động; bản thu mới sẽ xuất hiện tại đây."
        />
      )}
      {submissions.isSuccess && total > 0 && (
        <Card styles={{ body: { padding: 0 } }}>
          <SubmissionTable
            submissions={submissions.data.items}
            page={page}
            pageSize={pageSize}
            total={total}
            loading={submissions.isPlaceholderData}
            onPageChange={setPage}
            onOpen={(submission) => setOpenId(submission.id)}
          />
        </Card>
      )}
      <ReviewModal submissionId={openId} onClose={() => setOpenId(undefined)} />
    </Flex>
  )
}
