import { queryOptions, useQuery } from '@tanstack/react-query'
import { listLookup } from '../api/categoriesApi'
import { instrumentSkillCategoryId, type LookupItem, type LookupKind } from '../types'

/** Select option built from a catalog entry. */
export interface CatalogOption {
  value: string
  label: string
}

// Lookups change rarely; five minutes keeps every filter bar from refetching on mount.
const lookupQuery = (kind: LookupKind) =>
  queryOptions({ queryKey: ['lookups', kind], queryFn: () => listLookup(kind), staleTime: 5 * 60_000 })

const toOption = (item: LookupItem): CatalogOption => ({ value: item.id, label: item.name })

/**
 * Options for filters and forms from a backend lookup. While it is loading or unavailable the list is empty, so
 * the page using it still works without those choices.
 */
export function useCatalogOptions(kind: LookupKind): CatalogOption[] {
  return (useQuery(lookupQuery(kind)).data ?? []).map(toOption)
}

/** Skills split the way the backend checks song requirements: the Instrument category versus every other. */
export function useSkillOptions(): { vocal: CatalogOption[]; instrument: CatalogOption[] } {
  const skills = useQuery(lookupQuery('skills')).data ?? []
  return {
    vocal: skills.filter((skill) => skill.categoryId !== instrumentSkillCategoryId).map(toOption),
    instrument: skills.filter((skill) => skill.categoryId === instrumentSkillCategoryId).map(toOption),
  }
}
