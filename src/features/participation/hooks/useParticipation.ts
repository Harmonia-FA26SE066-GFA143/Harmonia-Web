import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getParticipation, sendParticipationRequests } from '../api/participationApi'

const participationKey = (programId: string) => ['participation', programId] as const

/** FE-34 asks for "real time"; the latency is UNRESOLVED, so the page refetches on focus and on demand. */
export function useParticipation(programId?: string) {
  return useQuery({
    queryKey: participationKey(programId ?? ''),
    queryFn: () => getParticipation(programId ?? ''),
    enabled: Boolean(programId),
  })
}

/** Reloads the requests after every attempt: a refusal may mean someone was asked meanwhile. */
export function useSendParticipationRequests(programId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (memberIds: string[]) => sendParticipationRequests(programId, memberIds),
    onSettled: () => queryClient.invalidateQueries({ queryKey: participationKey(programId) }),
  })
}
