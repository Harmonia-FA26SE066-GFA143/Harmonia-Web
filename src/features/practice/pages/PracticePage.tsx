import { Card, Flex, Segmented, Tabs } from 'antd'
import { useState } from 'react'
import { EmptyState, ErrorState, PageHeader, SectionSkeleton } from '@/shared/ui'
import { spacing } from '@/styles/tokens'
import { AssignmentForm } from '../components/AssignmentForm'
import { ProgressTab } from '../components/ProgressTab'
import { ReviewModal } from '../components/ReviewModal'
import { SubmissionTable } from '../components/SubmissionTable'
import { useSubmissions } from '../hooks/usePractice'
import { practiceStatusLabels, practiceStatuses, type PracticeStatus } from '../types'

const pageSize = 20

function ReviewQueue() {
  const [status, setStatus] = useState<PracticeStatus | 'all'>('submitted')
  const [page, setPage] = useState(1)
  const [openId, setOpenId] = useState<string>()
  const submissions = useSubmissions(status === 'all' ? undefined : status, { pageNumber: page, pageSize })
  const total = submissions.data?.totalCount ?? 0

  return (
    <Flex vertical gap={spacing.md}>
      <Segmented<PracticeStatus | 'all'>
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

/**
 * Choir Director: practice (FE-41–FE-44) as Harmonia-BE offers it (owner choice 2026-10-10). "Chấm bài" is the review
 * queue across every assignment, each member's newest attempt; "Giao bài" gives a new assignment; "Tiến độ" shows each
 * member's readiness for an upcoming event (FE-46). The backend has no list of the assignments given (tbd-backlog
 * B21), which supersedes the per-program assignment list of the 2026-10-01 decisions.
 */
export function PracticePage() {
  return (
    <>
      <PageHeader
        title="Bài tập & Tiến độ luyện tập"
        breadcrumb={[{ title: 'Ca trưởng' }, { title: 'Luyện tập' }]}
        description="Nghe và chấm bản thu ca viên nộp trên ứng dụng di động, giao bài tập mới và theo dõi tiến độ chuẩn bị của ca viên."
      />
      <Tabs
        destroyOnHidden
        items={[
          { key: 'review', label: 'Chấm bài', children: <ReviewQueue /> },
          { key: 'assign', label: 'Giao bài', children: <AssignmentForm /> },
          { key: 'progress', label: 'Tiến độ', children: <ProgressTab /> },
        ]}
      />
    </>
  )
}
