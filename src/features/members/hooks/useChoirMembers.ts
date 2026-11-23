import { useQuery } from '@tanstack/react-query'
import { listAllChoirMembers, listChoirMembers } from '../api/membersApi'

/** Active member profiles of the parish (Choir Director and Admin); `enabled` defers the request until it is needed. */
export function useChoirMembers(enabled = true) {
  return useQuery({ queryKey: ['choir-members'], queryFn: listChoirMembers, enabled })
}

/** Every active member profile across all pages (G2-03), for exact voice-part counts. */
export function useAllChoirMembers(enabled = true) {
  return useQuery({ queryKey: ['choir-members', 'all'], queryFn: listAllChoirMembers, enabled })
}
