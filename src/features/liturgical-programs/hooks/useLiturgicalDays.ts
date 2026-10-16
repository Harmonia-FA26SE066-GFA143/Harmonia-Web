import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { importLiturgicalCalendar, listLiturgicalDays } from '../api/liturgicalDaysApi'

const daysKey = ['liturgical-days'] as const

/** The days of a range by date; they change only through an import, so they stay fresh for the session. */
export function useLiturgicalDays(fromDate: string, toDate: string) {
  return useQuery({
    queryKey: [...daysKey, fromDate, toDate],
    queryFn: async () => new Map((await listLiturgicalDays(fromDate, toDate)).map((day) => [day.date, day])),
    staleTime: Infinity,
  })
}

export function useImportLiturgicalCalendar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => importLiturgicalCalendar(file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: daysKey }),
  })
}
