import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { countUnreadNotifications, listNotifications, markNotificationRead } from '../api/notificationsApi'

const notificationsKey = ['notifications'] as const
const pageSize = 10

/**
 * Unread count for the header badge. ponytail: polled every minute and on window focus instead of the backend's
 * SignalR hub (`/hubs/notifications`), which needs `@microsoft/signalr`; add it when notices must appear at once.
 */
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: [...notificationsKey, 'unread-count'],
    queryFn: countUnreadNotifications,
    refetchInterval: 60_000,
  })
}

/** Newest first, ten at a time; loaded while the list is open. */
export function useNotificationList(enabled: boolean) {
  return useInfiniteQuery({
    queryKey: [...notificationsKey, 'list'],
    queryFn: ({ pageParam }) => listNotifications(pageParam, pageSize),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.pageNumber < last.totalPages ? last.pageNumber + 1 : undefined),
    enabled,
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationsKey }),
  })
}
