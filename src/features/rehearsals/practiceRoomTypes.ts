// View model of the practice room, built from the rehearsal; materials and lyrics come from the song's materials.
export interface PracticeRoomSong {
  id: string
  title: string
  /** What to work on in this song, from the rehearsal. */
  note?: string
}

export interface PracticeRoomView {
  rehearsalId: string
  title: string
  startAt: string
  endAt: string
  locationName?: string
  note?: string
  songs: PracticeRoomSong[]
}
