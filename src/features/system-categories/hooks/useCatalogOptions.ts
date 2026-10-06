import { useQuery } from '@tanstack/react-query'
import { listLookup } from '../api/categoriesApi'
import type { LookupKind } from '../types'

/** Select option built from a catalog entry. */
export interface CatalogOption {
  value: string
  label: string
}

/**
 * Options for filters and forms from a backend lookup. While it is loading or unavailable the list is empty, so
 * the page using it still works without those choices.
 */
export function useCatalogOptions(kind: LookupKind): CatalogOption[] {
  // Lookups change rarely; five minutes keeps every filter bar from refetching on mount.
  const query = useQuery({ queryKey: ['lookups', kind], queryFn: () => listLookup(kind), staleTime: 5 * 60_000 })
  return (query.data ?? []).map((item) => ({ value: item.id, label: item.name }))
}
