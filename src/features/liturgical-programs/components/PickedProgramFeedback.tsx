import { Button } from 'antd'
import { EmptyState, ErrorState, SectionSkeleton } from '@/shared/ui'

interface QueryState {
  data?: unknown
  error: Error | null
  isError: boolean
  isFetching: boolean
  isPending: boolean
  refetch: () => unknown
}

interface PickedProgramFeedbackProps {
  programs: QueryState
  lookup: QueryState
  looking: boolean
  missing: boolean
  onShowUpcoming: () => void
}

/** Loading and failure states shared by pages whose program picker can also open a past program by id. */
export function PickedProgramFeedback({ programs, lookup, looking, missing, onShowUpcoming }: Readonly<PickedProgramFeedbackProps>) {
  return (
    <>
      {(programs.isPending || looking) && <SectionSkeleton rows={6} label="Đang tải chương trình phụng vụ" />}
      {programs.isError && (
        <ErrorState
          title="Không thể tải chương trình phụng vụ"
          error={programs.error}
          hasData={programs.data !== undefined}
          onRetry={() => programs.refetch()}
          retrying={programs.isFetching}
        />
      )}
      {lookup.isError && (
        <ErrorState
          title="Không thể tải chương trình phụng vụ"
          error={lookup.error}
          hasData={false}
          onRetry={() => lookup.refetch()}
          retrying={lookup.isFetching}
        />
      )}
      {missing && (
        <EmptyState
          title="Không tìm thấy chương trình phụng vụ"
          description="Chương trình không tồn tại, đã bị hủy hoặc đường dẫn không đúng."
          action={<Button onClick={onShowUpcoming}>Xem chương trình sắp tới</Button>}
        />
      )}
    </>
  )
}
