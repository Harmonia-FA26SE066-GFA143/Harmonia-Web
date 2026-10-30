import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { vietnamToday } from '@/lib/api/dates'
import { deleteRehearsal, getDefaultSongs, listRehearsals, saveRehearsal, type RehearsalPage } from '../api/rehearsalsApi'
import type { RehearsalFilters, RehearsalValues } from '../types'

const rehearsalsKey = ['rehearsals'] as const

/** One page of rehearsals; the previous page stays visible while the next one loads. */
export function useRehearsals(filters: RehearsalFilters, page: RehearsalPage) {
  return useQuery({
    queryKey: [...rehearsalsKey, 'list', filters, page],
    queryFn: () => listRehearsals(filters, page),
    placeholderData: keepPreviousData,
  })
}

/** Loads every page for a bounded week; no rehearsal is silently omitted by the paging limit. */
export function useAllRehearsals(filters: RehearsalFilters) {
  return useQuery({
    queryKey: [...rehearsalsKey, 'all', filters],
    queryFn: async () => {
      const pageSize = 100
      const first = await listRehearsals(filters, { pageNumber: 1, pageSize })
      const items = [...first.items]
      for (let pageNumber = 2; pageNumber <= first.totalPages; pageNumber += 1) {
        const next = await listRehearsals(filters, { pageNumber, pageSize })
        items.push(...next.items)
      }
      return { items, totalCount: first.totalCount }
    },
  })
}

/** How many rehearsals an event has, past and upcoming: one row of one page, read for its total. */
export function useRehearsalCount(eventId: string) {
  return useQuery({
    queryKey: [...rehearsalsKey, 'count', eventId],
    queryFn: async () => (await listRehearsals({ eventId }, { pageNumber: 1, pageSize: 1 })).totalCount,
  })
}

/**
 * Sessions from 30 days back to 7 days ahead, earliest first, for the attendance picker.
 * ponytail: fixed window of one page of 100; widen or page it if older sheets need correcting from the picker.
 */
export function useRecentRehearsals() {
  const today = dayjs(vietnamToday())
  const filters: RehearsalFilters = {
    fromDate: today.subtract(30, 'day').format('YYYY-MM-DD'),
    toDate: today.add(7, 'day').format('YYYY-MM-DD'),
  }
  return useQuery({
    queryKey: [...rehearsalsKey, 'recent', filters],
    queryFn: async () => (await listRehearsals(filters, { pageNumber: 1, pageSize: 100 })).items.toReversed(),
  })
}

/** Every attempt reloads the schedule: a refusal may mean the session changed or gained attendance. */
function useRehearsalMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<void>) {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn, onSettled: () => queryClient.invalidateQueries({ queryKey: rehearsalsKey }) })
}

export const useSaveRehearsal = () =>
  useRehearsalMutation((input: { id?: string; values: RehearsalValues }) => saveRehearsal(input))

export const useDeleteRehearsal = () => useRehearsalMutation((id: string) => deleteRehearsal(id))

/** Reads the suggested songs of an event on demand; nothing is saved. */
export const useDefaultSongs = () => useMutation({ mutationFn: (eventId: string) => getDefaultSongs(eventId) })

