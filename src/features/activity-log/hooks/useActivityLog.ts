import { useQuery } from '@tanstack/react-query'
import { ApiContractMissingError } from '@/lib/api/errors'
import { listActivityLog } from '../api/activityLogApi'

export function useActivityLog() {
  return useQuery({
    queryKey: ['activity-log'],
    queryFn: listActivityLog,
    // Retrying cannot help while the API contract is missing.
    retry: (failureCount, error) => !(error instanceof ApiContractMissingError) && failureCount < 3,
  })
}
