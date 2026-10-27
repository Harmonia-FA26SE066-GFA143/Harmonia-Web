import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSongList, listSongSuggestions, saveSongList, submitSongList } from '../api/songListsApi'
import type { SongList, SongListItemInput } from '../types'

const songListKey = (programId: string) => ['song-lists', programId] as const

/** The newest version of the program's list; `null` while there is none. */
export function useSongList(programId: string, { enabled = true } = {}) {
  return useQuery({ queryKey: songListKey(programId), queryFn: () => getSongList(programId), enabled })
}

/**
 * Saves the draft, then submits it when `submit` is set. Every attempt reloads the list and the programs (which
 * show its status), since a refusal may mean the list changed elsewhere.
 */
export function useSaveSongList(programId: string, current: SongList | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ items, submit }: { items: SongListItemInput[]; submit: boolean }) => {
      const saved = await saveSongList(programId, current, items)
      if (submit) await submitSongList(saved.id)
      return saved
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: songListKey(programId) })
      queryClient.invalidateQueries({ queryKey: ['liturgical-programs'] })
    },
  })
}

// ponytail: the first 50 suggestions; the list says when there are more, narrowed by choosing another slot.
const suggestionPage = { pageNumber: 1, pageSize: 50 }

/** Songs proposed for one slot of the program; nothing is asked before a slot is chosen. */
export function useSongSuggestions(programId: string, slotId?: string) {
  return useQuery({
    queryKey: ['song-lists', programId, 'suggestions', slotId],
    queryFn: () => listSongSuggestions(programId, slotId, suggestionPage),
    enabled: Boolean(slotId),
  })
}
