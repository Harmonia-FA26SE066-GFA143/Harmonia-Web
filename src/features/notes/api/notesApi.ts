import { apiRequest } from '@/lib/api/client'
import { toQuery, type PagedList } from '@/lib/api/paging'
import type { DirectorNote, DirectorNoteValues, NoteConversation, NoteRecipient } from '../types'

// `/api/director-notes` (Harmonia-BE DirectorNotesController): notes and chat between the Parish Priest and the
// Choir Directors. The Priest may also send a note about a day or event; both roles chat. New messages and read
// receipts arrive over the SignalR hub (see notesHub.ts).

export interface NotePage {
  pageNumber: number
  pageSize: number
}

interface DirectorNoteDto {
  id: string
  noteDate: string | null
  eventId: string | null
  eventTitle: string | null
  fromUserId: string
  fromUserName: string
  toUserId: string
  toUserName: string
  content: string
  sentAt: string
  readAt: string | null
}

interface ConversationDto {
  userId: string
  fullName: string
  lastNote: DirectorNoteDto
  unreadCount: number
}

const toNote = (dto: DirectorNoteDto): DirectorNote => ({
  id: dto.id,
  noteDate: dto.noteDate ?? undefined,
  eventId: dto.eventId ?? undefined,
  eventTitle: dto.eventTitle ?? undefined,
  fromUserId: dto.fromUserId,
  fromUserName: dto.fromUserName,
  toUserId: dto.toUserId,
  toUserName: dto.toUserName,
  content: dto.content,
  sentAt: dto.sentAt,
  readAt: dto.readAt ?? undefined,
})

/** The conversation with one person, newest message first. */
export async function listThread(withUserId: string, page: NotePage): Promise<PagedList<DirectorNote>> {
  const result = await apiRequest<PagedList<DirectorNoteDto>>(`/api/director-notes${toQuery({ withUserId, ...page })}`)
  return { ...result, items: result.items.map(toNote) }
}

/** One row per person the caller has exchanged a note or message with, latest first. */
export async function listConversations(): Promise<NoteConversation[]> {
  const rows = await apiRequest<ConversationDto[]>('/api/director-notes/conversations')
  return rows.map((row) => ({ userId: row.userId, fullName: row.fullName, lastNote: toNote(row.lastNote), unreadCount: row.unreadCount }))
}

/** Active Choir Directors for the Parish Priest, Parish Priests for a Choir Director. */
export async function listRecipients(): Promise<NoteRecipient[]> {
  const users = await apiRequest<NoteRecipient[]>('/api/director-notes/recipients')
  return users.map(({ id, fullName, email }) => ({ id, fullName, email }))
}

/** Chat message, either direction. */
export async function sendMessage(toUserId: string, content: string): Promise<DirectorNote> {
  return toNote(
    await apiRequest<DirectorNoteDto>('/api/director-notes/messages', {
      method: 'POST',
      body: JSON.stringify({ toUserId, content }),
    }),
  )
}

/** Parish Priest only: a note about a day or an event, one copy per Choir Director. */
export async function sendNote(values: DirectorNoteValues): Promise<void> {
  await apiRequest<unknown>('/api/director-notes', { method: 'POST', body: JSON.stringify(values) })
}

/** Marks everything `userId` sent the caller as read; the sender is told over the hub. */
export async function markConversationRead(userId: string): Promise<void> {
  await apiRequest<void>(`/api/director-notes/conversations/${userId}/read`, { method: 'PUT' })
}
