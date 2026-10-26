import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteLiturgicalName,
  listLiturgicalNames,
  listUntranslatedNames,
  saveLiturgicalName,
  type LiturgicalNameFilters,
} from '../api/liturgicalNamesApi'
import type { LiturgicalNameTranslationValues } from '../types'

const namesKey = ['system-categories', 'liturgical-names'] as const

export function useLiturgicalNames(filters: LiturgicalNameFilters, page: { pageNumber: number; pageSize: number }) {
  return useQuery({
    queryKey: [...namesKey, 'list', filters, page],
    queryFn: () => listLiturgicalNames(filters, page),
    placeholderData: keepPreviousData,
  })
}

export function useUntranslatedNames() {
  return useQuery({ queryKey: [...namesKey, 'missing'], queryFn: listUntranslatedNames })
}

/** A change also renames the liturgical days, so the calendar reloads them. */
function useNamesMutation<T>(mutationFn: (variables: T) => Promise<unknown>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: namesKey }),
        queryClient.invalidateQueries({ queryKey: ['liturgical-days'] }),
      ]),
  })
}

export const useSaveLiturgicalName = () =>
  useNamesMutation(({ id, values }: { id?: string; values: LiturgicalNameTranslationValues }) => saveLiturgicalName(id, values))

export const useDeleteLiturgicalName = () => useNamesMutation((id: string) => deleteLiturgicalName(id))
