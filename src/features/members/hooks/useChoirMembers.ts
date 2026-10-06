import { useQuery } from '@tanstack/react-query'
import { listChoirMembers } from '../api/membersApi'

export function useChoirMembers() {
  return useQuery({ queryKey: ['choir-members'], queryFn: listChoirMembers })
}
