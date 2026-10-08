import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addAssignment,
  finalizeRoster,
  getPersonnelRequirements,
  getRoster,
  getShortages,
  removeAssignment,
  replaceAssignment,
  savePersonnelRequirements,
  sendRosterNotifications,
  suggestRoster,
  type NewAssignment,
} from '../api/rosterApi'
import type { PersonnelRequirement } from '../types'

// Everything of a program sits under one key, so any change reloads its roster, shortages and requirements.
const rosterKey = (programId: string) => ['roster', programId] as const

/** `null` while the program has no roster yet. */
export function useRoster(programId?: string) {
  return useQuery({
    queryKey: rosterKey(programId ?? ''),
    queryFn: () => getRoster(programId ?? ''),
    enabled: Boolean(programId),
  })
}

export function useShortages(programId?: string) {
  return useQuery({
    queryKey: [...rosterKey(programId ?? ''), 'shortages'],
    queryFn: () => getShortages(programId ?? ''),
    enabled: Boolean(programId),
  })
}

export function usePersonnelRequirements(programId: string, songListItemId: string) {
  return useQuery({
    queryKey: [...rosterKey(programId), 'requirements', songListItemId],
    queryFn: () => getPersonnelRequirements(songListItemId),
  })
}

function useRosterChange<TVariables, TResult>(programId: string, mutationFn: (variables: TVariables) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn, onSuccess: () => queryClient.invalidateQueries({ queryKey: rosterKey(programId) }) })
}

export const useSavePersonnelRequirements = (programId: string, songListItemId: string) =>
  useRosterChange(programId, (rows: PersonnelRequirement[]) => savePersonnelRequirements(songListItemId, rows))

export const useSuggestRoster = (programId: string) => useRosterChange(programId, () => suggestRoster(programId))

export const useAddAssignment = (programId: string) =>
  useRosterChange(programId, (values: Omit<NewAssignment, 'eventId'>) => addAssignment({ eventId: programId, ...values }))

export const useReplaceAssignment = (programId: string) =>
  useRosterChange(programId, ({ assignmentId, memberId }: { assignmentId: string; memberId: string }) =>
    replaceAssignment(assignmentId, memberId),
  )

export const useRemoveAssignment = (programId: string) =>
  useRosterChange(programId, (assignmentId: string) => removeAssignment(assignmentId))

export const useFinalizeRoster = (programId: string) =>
  useRosterChange(programId, (rosterId: string) => finalizeRoster(rosterId))

export function useSendRosterNotifications() {
  return useMutation({
    mutationFn: ({ rosterId, memberIds }: { rosterId: string; memberIds: string[] }) =>
      sendRosterNotifications(rosterId, memberIds),
  })
}
