import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiContractMissingError } from '@/lib/api/errors'
import { createProgram, getProgram, listPrograms } from '../api/programsApi'
import type { ProgramFormValues } from '../types'

// Retrying cannot help while the API contract is missing.
const retry = (failureCount: number, error: Error) => !(error instanceof ApiContractMissingError) && failureCount < 3

const programsKey = ['liturgical-programs'] as const

export function usePrograms() {
  return useQuery({ queryKey: programsKey, queryFn: listPrograms, retry })
}

export function useProgram(id: string) {
  return useQuery({ queryKey: [...programsKey, id], queryFn: () => getProgram(id), retry })
}

export function useCreateProgram() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: ProgramFormValues) => createProgram(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: programsKey }),
  })
}
