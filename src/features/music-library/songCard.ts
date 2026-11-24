import dayjs from 'dayjs'
import type { Song } from './types'

export { materialKinds } from './types'

export function usageText(song: Song) {
  if (!song.timesUsed) return 'Chưa dùng trong lễ nào'
  const times = `Dùng ${song.timesUsed} lần`
  return song.lastUsedDate ? `${times} · gần nhất ${dayjs(song.lastUsedDate).format('DD/MM/YYYY')}` : times
}

export const songMeta = (song: Song) =>
  [song.composer ?? 'Chưa ghi tác giả', song.musicalKey, song.tempo].filter(Boolean).join(' · ')
