import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getApprovedSongList, getSongList, listPendingSongLists, reviewSongList } from '../api/songListReviewApi'
import type { ReviewValues } from '../types'

const reviewKey = ['song-list-review'] as const

export function usePendingSongLists() {
  return useQuery({ queryKey: [...reviewKey, 'pending'], queryFn: listPendingSongLists })
}

export function useSongList(id?: string) {
  return useQuery({ queryKey: [...reviewKey, 'list', id], queryFn: () => getSongList(id ?? ''), enabled: Boolean(id) })
}

export function useApprovedSongList(eventId: string) {
  return useQuery({ queryKey: [...reviewKey, 'approved', eventId], queryFn: () => getApprovedSongList(eventId) })
}

/**
 * Reloads after every attempt: a decision moves the list out of the pending ones, and a refusal usually means it was
 * already decided. The event's preparation status shows the list's status too.
 */
export function useReviewSongList() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ReviewValues }) => reviewSongList(id, values),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: reviewKey }),
        queryClient.invalidateQueries({ queryKey: ['liturgical-events'] }),
      ]),
  })
}
