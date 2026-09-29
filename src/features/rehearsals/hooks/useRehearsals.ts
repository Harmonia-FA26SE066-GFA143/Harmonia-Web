import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiContractMissingError } from '@/lib/api/errors'
import { deleteRehearsal, listRehearsals, saveRehearsal } from '../api/rehearsalsApi'
import type { RehearsalValues } from '../types'

// Retrying cannot help while the API contract is missing.
const retry = (failureCount: number, error: Error) => !(error instanceof ApiContractMissingError) && failureCount < 3

const rehearsalsKey = ['rehearsals'] as const

export function useRehearsals() {
  return useQuery({ queryKey: rehearsalsKey, queryFn: listRehearsals, retry })
}

export function useSaveRehearsal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { id?: string; values: RehearsalValues }) => saveRehearsal(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rehearsalsKey }),
  })
}

export function useDeleteRehearsal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteRehearsal(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rehearsalsKey }),
  })
}
