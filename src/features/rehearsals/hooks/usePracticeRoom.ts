import { useMemo } from 'react'
import type { Rehearsal } from '../types'
import type { PracticeRoomView } from '../practiceRoomTypes'

export function usePracticeRoom(rehearsal: Rehearsal | undefined) {
  return useMemo<PracticeRoomView | undefined>(() => {
    if (!rehearsal) return undefined
    return {
      rehearsalId: rehearsal.id,
      title: 'Buổi tập',
      startAt: rehearsal.startAt,
      endAt: rehearsal.endAt,
      locationName: rehearsal.locationName,
      note: rehearsal.note,
      songs: rehearsal.songs.map((song) => ({ id: song.songId, title: song.songTitle, note: song.note })),
    }
  }, [rehearsal])
}
