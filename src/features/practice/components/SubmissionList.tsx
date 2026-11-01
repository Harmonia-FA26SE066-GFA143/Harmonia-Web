import { App, Card, Flex, Segmented } from 'antd'
import { useState } from 'react'
import { EmptyState, ErrorState, SectionSkeleton } from '@/shared/ui'
import { spacing } from '@/styles/tokens'
import { usePassSubmission, useSubmissions } from '../hooks/usePractice'
import { practiceErrorMessage } from '../practiceErrors'
import { formatDuration } from '../practiceFormat'
import { practiceStatusLabels, practiceStatuses, type PracticeStatus, type ReviewResult } from '../types'
import { ReviewDrawer } from './ReviewDrawer'
import { SubmissionTable } from './SubmissionTable'

const pageSize = 20

export interface SubmissionListProps {
  /** Submissions of this assignment; absent for the review queue across every assignment. */
  assignmentId?: string
  defaultStatus: PracticeStatus | 'all'
}

/** Each member's newest attempt, filtered by status and paged on the server, reviewed in the review drawer (FE-42). */
export function SubmissionList({ assignmentId, defaultStatus }: Readonly<SubmissionListProps>) {
  const { message } = App.useApp()
  const [status, setStatus] = useState(defaultStatus)
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState<{ id: string; result?: ReviewResult; comment?: string }>()
  // A new key per opening resets the form; closing keeps it, so the drawer closes with its transition.
  const [opening, setOpening] = useState(0)
  const openReview = (next: NonNullable<typeof open>) => {
    setOpen(next)
    setOpening((count) => count + 1)
  }
  const submissions = useSubmissions(status === 'all' ? undefined : status, { pageNumber: page, pageSize }, assignmentId)
  const pass = usePassSubmission()
  // Rows marked "Đạt" here: they show their ✓ until the queue reloads without them.
  const [passed, setPassed] = useState<ReadonlySet<string>>(new Set())
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
        <ErrorState title="Không thể tải bản thu" error={submissions.error} hasData={submissions.data !== undefined} onRetry={() => submissions.refetch()} retrying={submissions.isFetching} />
      )}
      {submissions.data !== undefined && total === 0 && (
        <EmptyState
          title={status === 'submitted' ? 'Không có bản thu nào chờ chấm' : 'Không có bản thu nào'}
          description="Ca viên nộp bản thu trên ứng dụng di động; bản thu mới sẽ xuất hiện tại đây."
        />
      )}
      {submissions.data !== undefined && total > 0 && (
        <Card styles={{ body: { padding: 0 } }}>
          <SubmissionTable
            submissions={submissions.data.items}
            page={page}
            pageSize={pageSize}
            total={total}
            loading={submissions.isPlaceholderData}
            passingId={pass.isPending ? pass.variables : undefined}
            passedIds={passed}
            onPageChange={setPage}
            // The row's ✓ is the acknowledgement; only a refusal needs a message.
            onPass={(submission) =>
              !pass.isPending &&
              pass.mutate(submission.id, {
                onSuccess: () => setPassed((ids) => new Set(ids).add(submission.id)),
                onError: (error) => message.error(practiceErrorMessage(error, 'Không thể lưu đánh giá. Vui lòng thử lại.')),
              })
            }
            // The comment starts at the moment being heard, so the member finds the passage.
            onNeedsRevision={(submission, atSeconds) =>
              openReview({ id: submission.id, result: 'needsRevision', comment: atSeconds ? `[${formatDuration(Math.floor(atSeconds))}] ` : undefined })
            }
            onOpen={(submission) => openReview({ id: submission.id })}
          />
        </Card>
      )}
      <ReviewDrawer
        key={opening}
        submissionId={open?.id}
        initialResult={open?.result}
        initialComment={open?.comment}
        onClose={() => setOpen(undefined)}
      />
    </Flex>
  )
}
