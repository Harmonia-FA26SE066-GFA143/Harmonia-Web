import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addAssignment,
  finalizeRoster,
  finalizeWholeService,
  getEventRequirements,
  getPersonnelRequirements,
  getRoster,
  getShortages,
  removeAssignment,
  replaceAssignment,
  saveEventRequirements,
  savePersonnelRequirements,
  sendRosterNotifications,
  suggestRoster,
  updateAssignmentNote,
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

/** Requirements of one song of the approved list, or of the whole service when no song is given. */
export function usePersonnelRequirements(programId: string, songListItemId?: string) {
  return useQuery({
    queryKey: [...rosterKey(programId), 'requirements', songListItemId ?? 'whole-service'],
    queryFn: () => (songListItemId ? getPersonnelRequirements(songListItemId) : getEventRequirements(programId)),
  })
}

function useRosterChange<TVariables, TResult>(programId: string, mutationFn: (variables: TVariables) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn, onSuccess: () => queryClient.invalidateQueries({ queryKey: rosterKey(programId) }) })
}

export const useSavePersonnelRequirements = (programId: string, songListItemId?: string) =>
  useRosterChange(programId, (rows: PersonnelRequirement[]) =>
    songListItemId ? savePersonnelRequirements(songListItemId, rows) : saveEventRequirements(programId, rows),
  )

export const useSuggestRoster = (programId: string) => useRosterChange(programId, () => suggestRoster(programId))

export const useAddAssignment = (programId: string) =>
  useRosterChange(programId, (values: Omit<NewAssignment, 'eventId'>) => addAssignment({ eventId: programId, ...values }))

export const useReplaceAssignment = (programId: string) =>
  useRosterChange(programId, ({ assignmentId, memberId }: { assignmentId: string; memberId: string }) =>
    replaceAssignment(assignmentId, memberId),
  )

export const useRemoveAssignment = (programId: string) =>
  useRosterChange(programId, (assignmentId: string) => removeAssignment(assignmentId))

export const useUpdateAssignmentNote = (programId: string) =>
  useRosterChange(programId, ({ assignmentId, note }: { assignmentId: string; note: string }) => updateAssignmentNote(assignmentId, note))

export const useFinalizeWholeService = (programId: string) =>
  useRosterChange(programId, (rosterId: string) => finalizeWholeService(rosterId))

export const useFinalizeRoster = (programId: string) =>
  useRosterChange(programId, (rosterId: string) => finalizeRoster(rosterId))

export function useSendRosterNotifications() {
  return useMutation({
    mutationFn: ({ rosterId, memberIds }: { rosterId: string; memberIds: string[] }) =>
      sendRosterNotifications(rosterId, memberIds),
  })
}
