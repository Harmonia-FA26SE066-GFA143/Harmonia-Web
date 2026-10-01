import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiContractMissingError } from '@/lib/api/errors'
import { getRoster, getRosterSuggestions, saveRoster, sendAssignmentNotifications } from '../api/rosterApi'
import type { RosterValues } from '../types'

// Retrying cannot help while the API contract is missing.
const retry = (failureCount: number, error: Error) => !(error instanceof ApiContractMissingError) && failureCount < 3

const rosterKey = (programId: string) => ['roster', programId] as const

export function useRoster(programId?: string) {
  return useQuery({
    queryKey: rosterKey(programId ?? ''),
    queryFn: () => getRoster(programId ?? ''),
    enabled: Boolean(programId),
    retry,
  })
}

/** Suggestions are fetched on demand, when the Director asks for them. */
export function useRosterSuggestions(programId: string, enabled: boolean) {
  return useQuery({
    queryKey: [...rosterKey(programId), 'suggestions'],
    queryFn: () => getRosterSuggestions(programId),
    enabled,
    retry,
    gcTime: 0,
  })
}

export function useSaveRoster(programId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: RosterValues) => saveRoster(programId, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rosterKey(programId) }),
  })
}

export function useSendAssignmentNotifications(programId: string) {
  return useMutation({ mutationFn: (memberIds: string[]) => sendAssignmentNotifications(programId, memberIds) })
}
