import type { AccountFilters } from './types'

export const emptyAccountFilters: AccountFilters = { search: '' }

export function hasActiveFilters(filters: AccountFilters): boolean {
  return Boolean(filters.search.trim() || filters.role || filters.isActive !== undefined)
}
