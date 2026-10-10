import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  commentSubmission,
  createAssignment,
  getSubmission,
  listPreparationProgress,
  listSubmissions,
  listUpcomingEvents,
  reviewSubmission,
  type SubmissionPage,
} from '../api/practiceApi'
import type { AssignmentValues, PracticeStatus, ReviewResult } from '../types'

const practiceKey = ['practice'] as const

/** One page of the review queue; the previous page stays visible while the next one loads. */
export function useSubmissions(status: PracticeStatus | undefined, page: SubmissionPage) {
  return useQuery({
    queryKey: [...practiceKey, 'submissions', status, page],
    queryFn: () => listSubmissions(status, page),
    placeholderData: keepPreviousData,
  })
}

/** Fetched when the review opens: the signed audio URL of the list may have expired. */
export function useSubmission(id?: string) {
  return useQuery({
    queryKey: [...practiceKey, 'submission', id],
    queryFn: () => getSubmission(id ?? ''),
    enabled: Boolean(id),
    staleTime: 0,
  })
}

/** Reloads the queue and the open submission after every attempt: a refusal usually means it changed meanwhile. */
function usePracticeChange<TVariables>(mutationFn: (variables: TVariables) => Promise<void>) {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn, onSettled: () => queryClient.invalidateQueries({ queryKey: practiceKey }) })
}

export const useReviewSubmission = () =>
  usePracticeChange(({ id, result, comment }: { id: string; result: ReviewResult; comment?: string }) =>
    reviewSubmission(id, { result, comment }),
  )

export const useCommentSubmission = () =>
  usePracticeChange(({ id, comment, result }: { id: string; comment: string; result?: ReviewResult }) =>
    commentSubmission(id, { comment, result }),
  )

export function useCreateAssignment() {
  return useMutation({ mutationFn: (values: AssignmentValues) => createAssignment(values) })
}

export function useUpcomingEvents() {
  return useQuery({ queryKey: [...practiceKey, 'upcoming-events'], queryFn: listUpcomingEvents })
}

export function usePreparationProgress(eventId?: string) {
  return useQuery({
    queryKey: [...practiceKey, 'preparation-progress', eventId],
    queryFn: () => listPreparationProgress(eventId ?? ''),
    enabled: Boolean(eventId),
  })
}
