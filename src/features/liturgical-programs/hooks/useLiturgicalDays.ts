import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listLiturgicalDays, syncLiturgicalDays } from '../api/liturgicalDaysApi'

const daysKey = ['liturgical-days'] as const

/** The days of a range by date; they change only through a sync, so they stay fresh for the session. */
export function useLiturgicalDays(fromDate: string, toDate: string) {
  return useQuery({
    queryKey: [...daysKey, fromDate, toDate],
    queryFn: async () => new Map((await listLiturgicalDays(fromDate, toDate)).map((day) => [day.date, day])),
    staleTime: Infinity,
  })
}

export function useSyncLiturgicalDays() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (year: number) => syncLiturgicalDays(year),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: daysKey }),
  })
}
