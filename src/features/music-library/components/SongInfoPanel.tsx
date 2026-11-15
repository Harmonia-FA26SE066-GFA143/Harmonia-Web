import type { Song } from '../types'

const none = <span className="ct-facts__none">Chưa ghi</span>

/**
 * Song fields of GET /api/songs/{id} as one description list: label over value, two across, then the notes, on the
 * reading surface of the song page's side panel (artifact SongDetailPage).
 */
export function SongInfoPanel({ song }: Readonly<{ song: Song }>) {
  const facts = [
    { label: 'Giọng', value: song.musicalKey },
    { label: 'Nhịp độ', value: song.tempo },
    { label: 'Nhạc sĩ', value: song.composer },
    { label: 'Người viết lời', value: song.lyricist },
  ]
  return (
    <dl className="ct-facts">
      {facts.map(({ label, value }) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value || none}</dd>
        </div>
      ))}
      {song.notes && (
        <div className="is-wide">
          <dt>Ghi chú</dt>
          <dd className="ct-facts__text">{song.notes}</dd>
        </div>
      )}
    </dl>
  )
}
