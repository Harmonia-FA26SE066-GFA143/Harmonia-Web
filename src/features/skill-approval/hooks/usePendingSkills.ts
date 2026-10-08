import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { approveSkill, listPendingSkills, rejectSkill, type PendingSkillPage } from '../api/memberSkillsApi'

const pendingKey = ['skill-approval', 'pending'] as const

/** One page of pending declarations; the previous page stays visible while the next one loads. */
export function usePendingSkills(page: PendingSkillPage) {
  return useQuery({
    queryKey: [...pendingKey, page],
    queryFn: () => listPendingSkills(page),
    placeholderData: keepPreviousData,
  })
}

/**
 * Reloads the pending list after every attempt: a decision removes the row, and a refusal usually means another
 * Choir Director already decided it. Approved skills also change the member lists of other pages.
 */
function useReview<TVariables>(mutationFn: (variables: TVariables) => Promise<void>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: pendingKey }),
        queryClient.invalidateQueries({ queryKey: ['choir-members'] }),
      ]),
  })
}

export const useApproveSkill = () => useReview((id: string) => approveSkill(id))

export const useRejectSkill = () => useReview(({ id, reason }: { id: string; reason: string }) => rejectSkill(id, reason))
