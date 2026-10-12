import { App, Card, Typography } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { EmptyState, ErrorState, PageHeader, SectionSkeleton } from '@/shared/ui'
import { colors, spacing } from '@/styles/tokens'
import { PendingSkillTable } from '../components/PendingSkillTable'
import { RejectSkillModal } from '../components/RejectSkillModal'
import { useApproveSkill, usePendingSkills, useRejectSkill } from '../hooks/usePendingSkills'
import { isStaleReview, reviewErrorMessage } from '../skillReviewErrors'
import type { PendingSkill } from '../types'

const pageSize = 20

/** The next declaration to decide, or the results area when none is left. */
function focusNextDeclaration(results: HTMLElement | null) {
  const next = results?.querySelector<HTMLElement>('[data-action="approve"]:not([disabled])')
  if (next) next.focus()
  else results?.focus()
}

/**
 * Choir Director: skills members declared in the mobile app, waiting for review (FE-25, `/api/member-skills`).
 * Each one is approved or rejected with a reason; the backend notifies the member. Decided declarations leave the
 * list: the backend offers no history to the Choir Director.
 */
export function SkillApprovalPage() {
  const { message, modal } = App.useApp()
  const [page, setPage] = useState(1)
  const pending = usePendingSkills({ pageNumber: page, pageSize })
  const approve = useApproveSkill()
  const reject = useRejectSkill()
  const [rejecting, setRejecting] = useState<PendingSkill>()
  const results = useRef<HTMLDivElement>(null)
  const decided = useRef(false)
  const [decisions, setDecisions] = useState(0)

  const total = pending.data?.totalCount ?? 0
  // Deciding the only row of a later page would leave it empty: show the page before.
  const afterDecision = () => {
    if (page > 1 && pending.data?.items.length === 1) setPage(page - 1)
  }

  // The decided row is gone, so the focus would drop to the page: it goes to the next declaration once the list has
  // changed, and again after the dialog has closed (Ant Design gives the focus back to the row's button then).
  useEffect(() => {
    if (decisions > 0) focusNextDeclaration(results.current)
  }, [decisions])
  const focusAfterDialog = () => {
    if (!decided.current) return
    decided.current = false
    focusNextDeclaration(results.current)
  }

  const handleApprove = (skill: PendingSkill) => {
    modal.confirm({
      title: 'Duyệt kỹ năng?',
      content: `${skill.memberName} sẽ được ghi nhận kỹ năng ${skill.skillName}. Sau khi duyệt không thể đổi lại.`,
      okText: 'Duyệt',
      cancelText: 'Hủy',
      afterClose: focusAfterDialog,
      onOk: () =>
        approve
          .mutateAsync(skill.id)
          .then(() => {
            message.success(`Đã duyệt ${skill.skillName} của ${skill.memberName}.`)
            decided.current = true
            setDecisions((count) => count + 1)
            afterDecision()
          })
          .catch((error: Error) => message.error(reviewErrorMessage(error, 'Không thể duyệt kỹ năng. Vui lòng thử lại.'))),
    })
  }

  const handleReject = (reason: string) => {
    if (!rejecting || reject.isPending) return
    reject.mutate(
      { id: rejecting.id, reason },
      {
        onSuccess: () => {
          message.success(`Đã từ chối ${rejecting.skillName} của ${rejecting.memberName}.`)
          decided.current = true
          setDecisions((count) => count + 1)
          setRejecting(undefined)
          afterDecision()
        },
        onError: (error) => {
          message.error(reviewErrorMessage(error, 'Không thể từ chối kỹ năng. Vui lòng thử lại.'))
          // Nothing left to reject; otherwise the modal stays open with the reason entered.
          if (isStaleReview(error)) setRejecting(undefined)
        },
      },
    )
  }

  return (
    <>
      <PageHeader
        title="Duyệt kỹ năng"
        breadcrumb={[{ title: 'Ca trưởng' }, { title: 'Duyệt kỹ năng' }]}
        description="Kỹ năng ca viên khai báo trên ứng dụng di động, chờ Ca trưởng duyệt. Khai báo cũ nhất ở trên cùng."
      />

      <div ref={results} tabIndex={-1} role="region" aria-label="Kỹ năng chờ duyệt" style={{ outline: 'none' }}>
        {pending.isPending && <SectionSkeleton rows={5} label="Đang tải kỹ năng chờ duyệt" />}
        {pending.isError && (
          <ErrorState
            title="Không thể tải kỹ năng chờ duyệt"
            onRetry={() => pending.refetch()}
            retrying={pending.isFetching}
          />
        )}
        {pending.isSuccess && total === 0 && (
          <EmptyState
            title="Không có kỹ năng nào chờ duyệt"
            description="Khi ca viên khai báo kỹ năng trên ứng dụng, khai báo sẽ xuất hiện tại đây."
          />
        )}
        {pending.isSuccess && total > 0 && (
          <>
            <Typography.Text aria-live="polite" style={{ display: 'block', marginBottom: spacing.sm, color: colors.textMuted }}>
              {total} kỹ năng chờ duyệt
            </Typography.Text>
            <Card styles={{ body: { padding: 0 } }}>
              <PendingSkillTable
                skills={pending.data.items}
                page={page}
                pageSize={pageSize}
                total={total}
                loading={pending.isPlaceholderData}
                busyId={approve.isPending ? approve.variables : undefined}
                onPageChange={setPage}
                onApprove={handleApprove}
                onReject={setRejecting}
              />
            </Card>
          </>
        )}
      </div>

      <RejectSkillModal
        skill={rejecting}
        saving={reject.isPending}
        onSubmit={handleReject}
        onCancel={() => setRejecting(undefined)}
        afterClose={focusAfterDialog}
      />
    </>
  )
}
