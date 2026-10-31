import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { vietnamToday } from '@/lib/api/dates'
import { getProgram, getSongCredits, listPrograms } from '../api/programsApi'
import type { EventPage } from '../api/eventsApi'
import type { EventFilters } from '../types'

// Programs of the Choir Director pages. Song-list changes invalidate this key too, since rows show the list status.
const programsKey = ['liturgical-programs'] as const

/** One page of programs; the previous page stays visible while the next one loads. */
export function usePrograms(filters: EventFilters, page: EventPage) {
  return useQuery({
    queryKey: [...programsKey, 'list', filters, page],
    queryFn: () => listPrograms(filters, page),
    placeholderData: keepPreviousData,
  })
}

/**
 * Published programs from today on, earliest first, for the program pickers.
 * ponytail: first page of 100 only; page or search in the picker if a parish ever plans further ahead.
 */
export function useUpcomingPrograms() {
  const filters: EventFilters = { fromDate: vietnamToday(), status: 'published' }
  return useQuery({
    queryKey: [...programsKey, 'upcoming', filters],
    queryFn: async () => (await listPrograms(filters, { pageNumber: 1, pageSize: 100 })).items,
  })
}

export function useProgram(id: string) {
  return useQuery({ queryKey: [...programsKey, id], queryFn: () => getProgram(id) })
}

/** Composer, lyricist and material count of a listed song; they rarely change while a list is read. */
export function useSongCredits(songId?: string) {
  return useQuery({
    queryKey: ['songs', 'credits', songId],
    queryFn: () => getSongCredits(songId ?? ''),
    enabled: Boolean(songId),
    staleTime: 5 * 60_000,
  })
}
