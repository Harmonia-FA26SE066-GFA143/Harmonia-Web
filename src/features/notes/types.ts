/**
 * One note or chat message between the Parish Priest and a Choir Director (Harmonia-BE DirectorNoteDto).
 * A note from the Priest may be about a day, an event, or both; a chat message is about neither.
 */
export interface DirectorNote {
  id: string
  /** `DateOnly`, YYYY-MM-DD. */
  noteDate?: string
  eventId?: string
  eventTitle?: string
  fromUserId: string
  fromUserName: string
  toUserId: string
  toUserName: string
  content: string
  /** UTC `DateTime`. */
  sentAt: string
  /** UTC `DateTime`; absent until the recipient opens the conversation. */
  readAt?: string
}

/** One row of GET /api/director-notes/conversations (DirectorNoteConversationDto). */
export interface NoteConversation {
  userId: string
  fullName: string
  lastNote: DirectorNote
  /** Messages from this person the caller has not read. */
  unreadCount: number
}

/** Body of POST /api/director-notes (CreateDirectorNoteRequestValidator): a date or an event is required. */
export interface DirectorNoteValues {
  toUserIds: string[]
  noteDate?: string
  eventId?: string
  content: string
}

/** The other side of a conversation: the Choir Directors for the Priest, the Parish Priests for a Choir Director. */
export interface NoteRecipient {
  id: string
  fullName: string
  email: string
}
