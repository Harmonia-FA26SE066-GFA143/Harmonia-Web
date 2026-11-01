import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getLatestSongList, listPendingSongLists, listSongListVersions, reviewSongList } from '../api/songListReviewApi'
import type { ReviewValues } from '../types'

const reviewKey = ['song-list-review'] as const

export function usePendingSongLists() {
  return useQuery({ queryKey: [...reviewKey, 'pending'], queryFn: listPendingSongLists })
}

export function useLatestSongList(eventId: string) {
  return useQuery({ queryKey: [...reviewKey, 'latest', eventId], queryFn: () => getLatestSongList(eventId) })
}

/** Every version of the event's list, newest first; reloaded with the rest after a decision. */
export function useSongListVersions(eventId: string) {
  return useQuery({ queryKey: [...reviewKey, 'versions', eventId], queryFn: () => listSongListVersions(eventId) })
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
        // The program pages read the same list's status and songs.
        queryClient.invalidateQueries({ queryKey: ['liturgical-programs'] }),
      ]),
  })
}
