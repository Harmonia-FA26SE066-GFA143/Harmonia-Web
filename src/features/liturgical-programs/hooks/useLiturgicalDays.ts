import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getLiturgicalDay, importLiturgicalCalendar } from '../api/liturgicalDaysApi'

const daysKey = ['liturgical-days'] as const

/** A day's entry changes only through an import, so it stays fresh for the session. */
export function useLiturgicalDay(date: string) {
  return useQuery({ queryKey: [...daysKey, date], queryFn: () => getLiturgicalDay(date), staleTime: Infinity })
}

export function useImportLiturgicalCalendar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => importLiturgicalCalendar(file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: daysKey }),
  })
}
