/** `NotificationType` of Harmonia-BE. */
export type NotificationType =
  | 'eventPublished'
  | 'songListDecision'
  | 'participationRequest'
  | 'assignmentNotice'
  | 'practiceFeedback'
  | 'directorNote'
  | 'skillReview'
  | 'eventCancelled'

/**
 * Titles shown by type: the backend writes title and content in English (tbd-backlog B16), so the Web titles them
 * itself and shows the backend content as sent.
 */
export const notificationTitles: Record<NotificationType, string> = {
  eventPublished: 'Sự kiện mới được công bố',
  songListDecision: 'Kết quả duyệt danh sách bài hát',
  participationRequest: 'Yêu cầu xác nhận tham gia',
  assignmentNotice: 'Thông báo phân công phục vụ',
  practiceFeedback: 'Nhận xét bài luyện tập',
  directorNote: 'Ghi chú cho Ca trưởng',
  skillReview: 'Kết quả duyệt kỹ năng',
  eventCancelled: 'Sự kiện đã bị hủy',
}

/** A notification of the signed-in user (`NotificationDto`). */
export interface AppNotification {
  id: string
  /** Undefined for a type this Web version does not know; `title` is shown then. */
  type?: NotificationType
  title: string
  content: string
  /** Backend `DateTime`; read it with `parseUtc`. */
  createdAt: string
  isRead: boolean
}
