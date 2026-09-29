import { useQuery } from '@tanstack/react-query'
import { ApiContractMissingError } from '@/lib/api/errors'
import { listChoirMembers } from '../api/membersApi'

// Retrying cannot help while the API contract is missing.
const retry = (failureCount: number, error: Error) => !(error instanceof ApiContractMissingError) && failureCount < 3

export function useChoirMembers() {
  return useQuery({ queryKey: ['choir-members'], queryFn: listChoirMembers, retry })
}
