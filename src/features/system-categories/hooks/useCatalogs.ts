import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiContractMissingError } from '@/lib/api/errors'
import {
  createLiturgicalCategory,
  createSkillCategory,
  listLiturgicalCategories,
  listSkillCategories,
  updateLiturgicalCategory,
  updateSkillCategory,
} from '../api/categoriesApi'
import type { CatalogItemValues, LiturgicalCatalog } from '../types'

// Retrying cannot help while the API contract is missing.
const retry = (failureCount: number, error: Error) => !(error instanceof ApiContractMissingError) && failureCount < 3

/** Values for the add/edit modal; `id` is present when editing an existing entry. */
export interface SaveCatalogItem {
  id?: string
  values: CatalogItemValues
}

const skillKey = ['system-categories', 'skills'] as const
const liturgicalKey = (catalog: LiturgicalCatalog) => ['system-categories', 'liturgical', catalog] as const

export function useSkillCategories() {
  return useQuery({ queryKey: skillKey, queryFn: listSkillCategories, retry })
}

export function useSaveSkillCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: SaveCatalogItem) =>
      id ? updateSkillCategory(id, values) : createSkillCategory(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: skillKey }),
  })
}

export function useLiturgicalCategories(catalog: LiturgicalCatalog) {
  return useQuery({ queryKey: liturgicalKey(catalog), queryFn: () => listLiturgicalCategories(catalog), retry })
}

export function useSaveLiturgicalCategory(catalog: LiturgicalCatalog) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: SaveCatalogItem) =>
      id ? updateLiturgicalCategory(catalog, id, values) : createLiturgicalCategory(catalog, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: liturgicalKey(catalog) }),
  })
}
