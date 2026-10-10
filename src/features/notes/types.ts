/** One Choir Director's copy of a note from the Parish Priest (Harmonia-BE DirectorNoteDto): about a day, an event, or both. */
export interface DirectorNote {
  id: string
  /** `DateOnly`, YYYY-MM-DD. */
  noteDate?: string
  eventId?: string
  eventTitle?: string
  fromUserName: string
  toUserName: string
  content: string
  /** UTC `DateTime`. */
  sentAt: string
}

/** Body of POST /api/director-notes (CreateDirectorNoteRequestValidator): a date or an event is required. */
export interface DirectorNoteValues {
  toUserIds: string[]
  noteDate?: string
  eventId?: string
  content: string
}

export interface NoteRecipient {
  id: string
  fullName: string
  email: string
}
