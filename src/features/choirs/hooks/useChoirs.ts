import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addChoirMembers,
  listChoirs,
  listEventChoirs,
  listMembersOfChoir,
  removeChoirMember,
  saveChoir,
  setSubstituteDirector,
  updateEventChoirs,
} from '../api/choirsApi'
import type { ChoirValues, EventChoirsValues } from '../types'

const choirsKey = ['choirs'] as const

/** Admin and Parish Priest: every choir; Choir Director: the choirs they direct. */
export function useChoirs(enabled = true) {
  return useQuery({ queryKey: [...choirsKey, 'list'], queryFn: listChoirs, enabled })
}

export function useMembersOfChoir(choirId?: string) {
  return useQuery({
    queryKey: [...choirsKey, 'members', choirId],
    queryFn: () => listMembersOfChoir(choirId ?? ''),
    enabled: Boolean(choirId),
  })
}

/** The members of several choirs as one list, each member once; `data` waits for every choir. */
export function useMembersOfChoirs(choirIds: string[]) {
  return useQueries({
    queries: choirIds.map((choirId) => ({ queryKey: [...choirsKey, 'members', choirId], queryFn: () => listMembersOfChoir(choirId) })),
    combine: (results) => ({
      data: results.every((result) => result.data !== undefined)
        ? [...new Map(results.flatMap((result) => result.data ?? []).map((member) => [member.memberId, member])).values()]
        : undefined,
      isError: results.some((result) => result.isError),
      isFetching: results.some((result) => result.isFetching),
      refetch: () => results.forEach((result) => result.isError && result.refetch()),
    }),
  })
}

export function useEventChoirs(eventId: string) {
  return useQuery({ queryKey: [...choirsKey, 'event', eventId], queryFn: () => listEventChoirs(eventId) })
}

/** Every attempt reloads the choirs: a refusal usually means someone else changed them meanwhile. */
function useChoirMutation<TVariables, TResult>(mutationFn: (variables: TVariables) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn, onSettled: () => queryClient.invalidateQueries({ queryKey: choirsKey }) })
}

export const useSaveChoir = () => useChoirMutation((input: { id?: string; values: ChoirValues }) => saveChoir(input))

export const useAddChoirMembers = (choirId: string) =>
  useChoirMutation((memberIds: string[]) => addChoirMembers(choirId, memberIds))

export const useRemoveChoirMember = (choirId: string) =>
  useChoirMutation((memberId: string) => removeChoirMember(choirId, memberId))

export const useUpdateEventChoirs = (eventId: string) =>
  useChoirMutation((value: EventChoirsValues) => updateEventChoirs(eventId, value))

export const useSetSubstituteDirector = (eventId: string) =>
  useChoirMutation(({ choirId, ...value }: { choirId: string; directorId: string | null; reason?: string }) =>
    setSubstituteDirector(eventId, choirId, value),
  )
