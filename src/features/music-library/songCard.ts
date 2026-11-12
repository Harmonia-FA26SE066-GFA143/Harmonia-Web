import dayjs from 'dayjs'
import type { MaterialKind, Song } from './types'

/** The materials a card names, in the words a singer uses (SongDto `materialCounts`). */
export const cardMaterials: { kind: MaterialKind; label: string }[] = [
  { kind: 'sheetMusic', label: 'Bản nhạc' },
  { kind: 'lyrics', label: 'Lời' },
  { kind: 'sampleAudio', label: 'Audio' },
  { kind: 'interactiveScore', label: 'Tương tác' },
]

export const usageText = (song: Song) =>
  song.timesUsed
    ? `Dùng ${song.timesUsed} lần${song.lastUsedDate ? ` · gần nhất ${dayjs(song.lastUsedDate).format('DD/MM/YYYY')}` : ''}`
    : 'Chưa dùng trong lễ nào'

export const songMeta = (song: Song) =>
  [song.composer ?? 'Chưa ghi tác giả', song.musicalKey, song.tempo].filter(Boolean).join(' · ')
