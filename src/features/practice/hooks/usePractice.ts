import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiContractMissingError } from '@/lib/api/errors'
import { createAssignment, listAssignments, listSubmissions, reviewSubmission } from '../api/practiceApi'
import type { PracticeAssignmentValues, ReviewResult } from '../types'

// Retrying cannot help while the API contract is missing.
const retry = (failureCount: number, error: Error) => !(error instanceof ApiContractMissingError) && failureCount < 3

const practiceKey = (programId: string) => ['practice', programId] as const

export function usePracticeAssignments(programId?: string) {
  return useQuery({
    queryKey: [...practiceKey(programId ?? ''), 'assignments'],
    queryFn: () => listAssignments(programId ?? ''),
    enabled: Boolean(programId),
    retry,
  })
}

export function usePracticeSubmissions(programId?: string) {
  return useQuery({
    queryKey: [...practiceKey(programId ?? ''), 'submissions'],
    queryFn: () => listSubmissions(programId ?? ''),
    enabled: Boolean(programId),
    retry,
  })
}

export function useCreateAssignment(programId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: PracticeAssignmentValues) => createAssignment(programId, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: practiceKey(programId) }),
  })
}

export function useReviewSubmission(programId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ submissionId, ...review }: { submissionId: string; result: ReviewResult; feedback?: string }) =>
      reviewSubmission(submissionId, review),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: practiceKey(programId) }),
  })
}
