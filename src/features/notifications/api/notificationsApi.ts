import { apiRequest } from '@/lib/api/client'
import { toQuery, type PagedList } from '@/lib/api/paging'
import type { AppNotification } from '../types'

// `/api/notifications` (Harmonia-BE NotificationsController): every signed-in user reads their own, newest first.

export function listNotifications(pageNumber: number, pageSize: number): Promise<PagedList<AppNotification>> {
  return apiRequest<PagedList<AppNotification>>(`/api/notifications${toQuery({ pageNumber, pageSize })}`)
}

/** The event of a song list a notification refers to (`GET /api/song-lists/{id}`, Choir Director and Parish Priest). */
export async function getSongListEventId(songListId: string): Promise<string> {
  return (await apiRequest<{ eventId: string }>(`/api/song-lists/${songListId}`)).eventId
}

export function countUnreadNotifications(): Promise<number> {
  return apiRequest<number>('/api/notifications/unread-count')
}

/** Marking an already read notification again is accepted (NotificationService.MarkAsReadAsync). */
export async function markNotificationRead(id: string): Promise<void> {
  await apiRequest<unknown>(`/api/notifications/${id}/read`, { method: 'PUT' })
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiRequest<unknown>('/api/notifications/read-all', { method: 'PUT' })
}
