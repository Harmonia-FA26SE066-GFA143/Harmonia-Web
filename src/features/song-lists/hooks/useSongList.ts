import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiContractMissingError } from '@/lib/api/errors'
import { getSongList, rejectSongList, submitSongList, submitSongReview } from '../api/songListsApi'
import type { SongListItemInput, SongReview } from '../types'

// Retrying cannot help while the API contract is missing.
const retry = (failureCount: number, error: Error) => !(error instanceof ApiContractMissingError) && failureCount < 3

const songListKey = (programId: string) => ['song-lists', programId] as const

export function useSongList(programId: string, { enabled = true } = {}) {
  return useQuery({ queryKey: songListKey(programId), queryFn: () => getSongList(programId), retry, enabled })
}

/** Refreshes the list and the programs (which show the list's status). */
function useSongListMutation<TVariables>(programId: string, mutationFn: (variables: TVariables) => Promise<unknown>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: songListKey(programId) })
      queryClient.invalidateQueries({ queryKey: ['liturgical-programs'] })
    },
  })
}

export const useSubmitSongList = (programId: string) =>
  useSongListMutation(programId, (items: SongListItemInput[]) => submitSongList(programId, items))

export const useSubmitSongReview = (programId: string) =>
  useSongListMutation(programId, (review: { decisions: Record<string, SongReview>; note?: string }) =>
    submitSongReview(programId, review),
  )

export const useRejectSongList = (programId: string) =>
  useSongListMutation(programId, (note: string) => rejectSongList(programId, note))
