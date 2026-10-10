import { apiRequest } from '@/lib/api/client'
import { toQuery, type PagedList } from '@/lib/api/paging'
import type { DirectorNote, DirectorNoteValues, NoteRecipient } from '../types'

// `/api/director-notes` (Harmonia-BE DirectorNotesController): the Parish Priest sends a note to Choir Directors,
// each of them getting their own copy and a notification; both roles list the notes they sent or received.

export interface NotePage {
  pageNumber: number
  pageSize: number
}

interface DirectorNoteDto {
  id: string
  noteDate: string | null
  eventId: string | null
  eventTitle: string | null
  fromUserName: string
  toUserName: string
  content: string
  sentAt: string
}

const toNote = (dto: DirectorNoteDto): DirectorNote => ({
  id: dto.id,
  noteDate: dto.noteDate ?? undefined,
  eventId: dto.eventId ?? undefined,
  eventTitle: dto.eventTitle ?? undefined,
  fromUserName: dto.fromUserName,
  toUserName: dto.toUserName,
  content: dto.content,
  sentAt: dto.sentAt,
})

/** Notes the caller sent or received, newest first. */
export async function listNotes(page: NotePage): Promise<PagedList<DirectorNote>> {
  const result = await apiRequest<PagedList<DirectorNoteDto>>(`/api/director-notes${toQuery({ ...page })}`)
  return { ...result, items: result.items.map(toNote) }
}

/** Parish Priest only: the active Choir Directors a note can go to. */
export async function listRecipients(): Promise<NoteRecipient[]> {
  const users = await apiRequest<NoteRecipient[]>('/api/director-notes/recipients')
  return users.map(({ id, fullName, email }) => ({ id, fullName, email }))
}

/** Parish Priest only. */
export async function sendNote(values: DirectorNoteValues): Promise<void> {
  await apiRequest<unknown>('/api/director-notes', { method: 'POST', body: JSON.stringify(values) })
}
