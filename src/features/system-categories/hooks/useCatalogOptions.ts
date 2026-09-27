import type { LiturgicalCatalog } from '../types'
import { useLiturgicalCategories } from './useCatalogs'

/** Select option built from a catalog entry. */
export interface CatalogOption {
  value: string
  label: string
}

/**
 * Options for filters and forms from an FE-50 liturgical catalog. While the catalog is loading or unavailable
 * the list is empty, so the page using it still works without those choices.
 */
export function useCatalogOptions(catalog: LiturgicalCatalog): CatalogOption[] {
  const query = useLiturgicalCategories(catalog)
  return (query.data ?? []).map((item) => ({ value: item.id, label: item.name }))
}
