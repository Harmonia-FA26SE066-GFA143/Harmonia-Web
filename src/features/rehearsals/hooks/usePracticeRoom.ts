import { useMemo } from 'react'
import type { Rehearsal } from '../types'
import type { PracticeRoomView } from '../practiceRoomTypes'

/** UI adapter boundary: future API/lyrics/audio sources replace this function without changing the page. */
export function usePracticeRoom(rehearsal: Rehearsal | undefined, fixture?: PracticeRoomView) {
  return useMemo<PracticeRoomView | undefined>(() => {
    if (!rehearsal) return undefined
    return {
      ...(fixture ?? { rehearsalId: rehearsal.id, title: 'Buổi tập', startAt: rehearsal.startAt, endAt: rehearsal.endAt, songs: [] }),
      rehearsalId: rehearsal.id,
      startAt: rehearsal.startAt,
      endAt: rehearsal.endAt,
      locationName: rehearsal.locationName,
      note: rehearsal.note,
      songs: rehearsal.songs.length
        ? rehearsal.songs.map((song, index) => fixture?.songs[index] ? { ...fixture.songs[index], id: song.songId, title: song.songTitle } : { id: song.songId, title: song.songTitle, durationSeconds: 0, localState: 'notStarted' as const, lyrics: [] })
        : (fixture?.songs ?? []),
    }
  }, [fixture, rehearsal])
}
