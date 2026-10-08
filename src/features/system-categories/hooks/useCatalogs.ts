import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listCatalogItems,
  listSeasons,
  listSkills,
  saveCatalogItem,
  saveSeason,
  saveSkill,
} from '../api/categoriesApi'
import type { BasicCatalog, CatalogItemValues, LookupKind } from '../types'

/** Values for the add/edit modal; `id` is present when editing an existing entry. */
export interface SaveCatalogEntry<V> {
  id?: string
  values: V
}

const catalogKey = (kind: LookupKind) => ['system-categories', kind] as const

export function useCatalogItems(kind: BasicCatalog) {
  return useQuery({ queryKey: catalogKey(kind), queryFn: () => listCatalogItems(kind) })
}

export function useSkills() {
  return useQuery({ queryKey: catalogKey('skills'), queryFn: listSkills })
}

export function useSeasons() {
  return useQuery({ queryKey: catalogKey('seasons'), queryFn: listSeasons })
}

function useSave<T, V>(kind: LookupKind, save: (id: string | undefined, values: V) => Promise<T>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: SaveCatalogEntry<V>) => save(id, values),
    // The selects of other pages read the active lookups; a skill category also decides which skills they offer.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: catalogKey(kind) }),
        queryClient.invalidateQueries({ queryKey: ['lookups'] }),
      ]),
  })
}

export function useSaveCatalogItem(kind: BasicCatalog) {
  return useSave(kind, (id, values: CatalogItemValues) => saveCatalogItem(kind, id, values))
}

export function useSaveSkill() {
  return useSave('skills', saveSkill)
}

export function useSaveSeason() {
  return useSave('seasons', saveSeason)
}
