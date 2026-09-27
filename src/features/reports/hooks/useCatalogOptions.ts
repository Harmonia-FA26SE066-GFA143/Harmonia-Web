import { useLiturgicalCategories, type LiturgicalCatalog } from '@/features/system-categories'
import type { FilterOption } from '../components/ReportFilterBar'

/**
 * Filter options from an FE-50 liturgical catalog. While the catalog is loading or unavailable the list is
 * empty, so the report itself still loads without that filter.
 */
export function useCatalogOptions(catalog: LiturgicalCatalog): FilterOption[] {
  const query = useLiturgicalCategories(catalog)
  return (query.data ?? []).map((item) => ({ value: item.id, label: item.name }))
}
