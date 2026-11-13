/** A notification of the signed-in user (`NotificationDto`); the backend writes `title` and `content` in Vietnamese. */
export interface AppNotification {
  id: string
  title: string
  content: string
  /** Backend `DateTime`; read it with `parseUtc`. */
  createdAt: string
  isRead: boolean
  /** Entity name of what the notification is about (e.g. `LiturgicalEvent`) and its id; absent on general ones. */
  referenceType?: string | null
  referenceId?: string | null
}
