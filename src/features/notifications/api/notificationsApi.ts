import { apiRequest } from '@/lib/api/client'
import { toQuery, type PagedList } from '@/lib/api/paging'
import type { AppNotification, NotificationType } from '../types'

// `/api/notifications` (Harmonia-BE NotificationsController): every signed-in user reads their own, newest first.

const typeByApi: Record<string, NotificationType> = {
  EventPublished: 'eventPublished',
  SongListDecision: 'songListDecision',
  ParticipationRequest: 'participationRequest',
  AssignmentNotice: 'assignmentNotice',
  PracticeFeedback: 'practiceFeedback',
  DirectorNote: 'directorNote',
  SkillReview: 'skillReview',
  EventCancelled: 'eventCancelled',
}

interface NotificationDto {
  id: string
  type: string
  title: string
  content: string
  createdAt: string
  isRead: boolean
}

export async function listNotifications(pageNumber: number, pageSize: number): Promise<PagedList<AppNotification>> {
  const result = await apiRequest<PagedList<NotificationDto>>(`/api/notifications${toQuery({ pageNumber, pageSize })}`)
  return {
    ...result,
    items: result.items.map(({ id, type, title, content, createdAt, isRead }) => ({
      id,
      type: typeByApi[type],
      title,
      content,
      createdAt,
      isRead,
    })),
  }
}

export function countUnreadNotifications(): Promise<number> {
  return apiRequest<number>('/api/notifications/unread-count')
}

/** Marking an already read notification again is accepted (NotificationService.MarkAsReadAsync). */
export async function markNotificationRead(id: string): Promise<void> {
  await apiRequest<unknown>(`/api/notifications/${id}/read`, { method: 'PUT' })
}
