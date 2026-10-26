import { useQuery } from '@tanstack/react-query'
import { listChoirMembers } from '../api/membersApi'

/** Active member profiles of the parish (Choir Director and Admin); `enabled` defers the request until it is needed. */
export function useChoirMembers(enabled = true) {
  return useQuery({ queryKey: ['choir-members'], queryFn: listChoirMembers, enabled })
}
