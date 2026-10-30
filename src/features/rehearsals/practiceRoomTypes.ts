// UI-only view model. Practice audio, lyrics and local progress are not API contract fields.
export interface PracticeRoomLyricLine {
  id: string
  text: string
  startSeconds: number
  endSeconds: number
}

export type PracticeSongLocalState = 'notStarted' | 'inProgress' | 'listened'

export interface PracticeRoomSong {
  id: string
  title: string
  section?: string
  audioUrl?: string
  durationSeconds: number
  lyrics: PracticeRoomLyricLine[]
  localState: PracticeSongLocalState
}

export interface PracticeRoomView {
  rehearsalId: string
  title: string
  startAt: string
  endAt: string
  locationName?: string
  programName?: string
  note?: string
  songs: PracticeRoomSong[]
}
