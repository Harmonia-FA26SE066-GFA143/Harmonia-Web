import { useQuery } from '@tanstack/react-query'
import { ApiContractMissingError } from '@/lib/api/errors'
import { getProgram, listPrograms } from '../api/programsApi'

// Programs with their song lists, for the Choir Director and song-list pages: song lists have no backend yet.
// Retrying cannot help while the API contract is missing.
const retry = (failureCount: number, error: Error) => !(error instanceof ApiContractMissingError) && failureCount < 3

const programsKey = ['liturgical-programs'] as const

export function usePrograms() {
  return useQuery({ queryKey: programsKey, queryFn: listPrograms, retry })
}

export function useProgram(id: string) {
  return useQuery({ queryKey: [...programsKey, id], queryFn: () => getProgram(id), retry })
}
