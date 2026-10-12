import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { listActivityLog, type ActivityPage, type ActivityQuery } from '../api/activityLogApi'

/** One page of the log; the previous page stays visible while the next one loads. */
export function useActivityLog(query: ActivityQuery, page: ActivityPage) {
  return useQuery({
    queryKey: ['activity-log', query, page],
    queryFn: () => listActivityLog(query, page),
    placeholderData: keepPreviousData,
  })
}
