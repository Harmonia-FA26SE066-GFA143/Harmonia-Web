import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiContractMissingError } from '@/lib/api/errors'
import { getParticipation, sendParticipationRequests } from '../api/participationApi'

// Retrying cannot help while the API contract is missing.
const retry = (failureCount: number, error: Error) => !(error instanceof ApiContractMissingError) && failureCount < 3

const participationKey = (programId: string) => ['participation', programId] as const

/** FE-34 asks for "real time"; the latency is UNRESOLVED, so the page refetches on focus and on demand. */
export function useParticipation(programId?: string) {
  return useQuery({
    queryKey: participationKey(programId ?? ''),
    queryFn: () => getParticipation(programId ?? ''),
    enabled: Boolean(programId),
    retry,
  })
}

export function useSendParticipationRequests(programId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (memberIds: string[]) => sendParticipationRequests(programId, memberIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: participationKey(programId) }),
  })
}
