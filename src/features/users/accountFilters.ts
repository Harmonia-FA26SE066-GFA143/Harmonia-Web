import { matchesSearch } from '@/shared/utils/search'
import type { Account, AccountFilters } from './types'

export const emptyAccountFilters: AccountFilters = { search: '' }

export function hasActiveFilters(filters: AccountFilters): boolean {
  return Boolean(filters.search.trim() || filters.role || filters.status)
}

export function filterAccounts(accounts: Account[], filters: AccountFilters): Account[] {
  return accounts.filter(
    (account) =>
      matchesSearch(filters.search, account.fullName, account.email) &&
      (!filters.role || account.role === filters.role) &&
      (!filters.status || account.status === filters.status),
  )
}
