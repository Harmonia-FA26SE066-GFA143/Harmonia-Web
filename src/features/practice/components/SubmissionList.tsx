import { Card, Flex, Segmented } from 'antd'
import { useState } from 'react'
import { EmptyState, ErrorState, SectionSkeleton } from '@/shared/ui'
import { spacing } from '@/styles/tokens'
import { useSubmissions } from '../hooks/usePractice'
import { practiceStatusLabels, practiceStatuses, type PracticeStatus } from '../types'
import { ReviewPanel } from './ReviewPanel'
import { SubmissionTable } from './SubmissionTable'

const pageSize = 20

export interface SubmissionListProps {
  /** Submissions of this assignment; absent for the review queue across every assignment. */
  assignmentId?: string
  defaultStatus: PracticeStatus | 'all'
  /** Stacks the queue over the review panel (e.g. inside a 720px detail drawer). */
  stacked?: boolean
}

/** Each member's newest attempt, filtered by status and paged on the server, reviewed in the review panel (FE-42). */
export function SubmissionList({ assignmentId, defaultStatus, stacked = false }: Readonly<SubmissionListProps>) {
  const [status, setStatus] = useState(defaultStatus)
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState<{ id: string }>()
  // A new key per opening resets the form; closing keeps it, so the drawer closes with its transition.
  const [opening, setOpening] = useState(0)
  const openReview = (next: typeof open) => {
    setOpen(next)
    setOpening((count) => count + 1)
  }
  const submissions = useSubmissions(status === 'all' ? undefined : status, { pageNumber: page, pageSize }, assignmentId)
  const total = submissions.data?.totalCount ?? 0
  const items = submissions.data?.items ?? []
  // The panel shows the picked submission, else the first of the queue.
  const shown = open && items.some((item) => item.id === open.id) ? open : items[0] && { id: items[0].id }
  // After a decision the next one in the queue is picked; the reloaded queue may no longer hold the one just decided.
  const pickNext = () => {
    const index = items.findIndex((item) => item.id === shown?.id)
    const next = items[index + 1]
    openReview(next ? { id: next.id } : undefined)
  }

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
        <div className={stacked ? 'hm-split hm-split--review is-stacked' : 'hm-split hm-split--review'}>
          <Card styles={{ body: { padding: 0 } }}>
            <SubmissionTable
              selectedId={shown?.id}
              submissions={submissions.data.items}
              page={page}
              pageSize={pageSize}
              total={total}
              loading={submissions.isPlaceholderData}
              onPageChange={setPage}
              onOpen={(submission) => openReview({ id: submission.id })}
            />
          </Card>
          <ReviewPanel
            key={`${shown?.id ?? 'none'}:${opening}`}
            submissionId={shown?.id}
            onDone={pickNext}
          />
        </div>
      )}
    </Flex>
  )
}
