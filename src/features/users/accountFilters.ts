import type { SystemRole } from '@/shared/types/account'
import { assignableRoles } from './roles'
import type { AccountFilters } from './types'

export const emptyAccountFilters: AccountFilters = { search: '' }

export function hasActiveFilters(filters: AccountFilters): boolean {
  return Boolean(filters.search.trim() || filters.role || filters.isActive !== undefined)
}

const validRoles = new Set<string>(assignableRoles)

/** Reads `?search=&role=&isActive=&page=` from the URL; invalid values fall back cleanly. */
export function readAccountListState(params: URLSearchParams): { filters: AccountFilters; page: number } {
  const roleParam = params.get('role') ?? undefined
  const activeParam = params.get('isActive')
  const isActive = activeParam === 'true' ? true : activeParam === 'false' ? false : undefined
  return {
    filters: {
      search: params.get('search') ?? '',
      role: roleParam && validRoles.has(roleParam) ? (roleParam as SystemRole) : undefined,
      isActive,
    },
    page: Math.max(1, Number.parseInt(params.get('page') ?? '', 10) || 1),
  }
}

export function writeAccountListState(filters: AccountFilters, page: number): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.role) params.set('role', filters.role)
  if (filters.isActive !== undefined) params.set('isActive', String(filters.isActive))
  if (page > 1) params.set('page', String(page))
  return params
}
