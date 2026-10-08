import type { MemberFilters } from './types'

export const emptyMemberFilters: MemberFilters = { search: '' }

export function hasActiveMemberFilters(filters: MemberFilters): boolean {
  return Boolean(filters.search.trim() || filters.status || filters.skillId)
}
