import type { ReactNode } from 'react'
import type { Song } from '../types'

const none = <span className="ct-facts__none">Chưa ghi</span>

const urlPattern = /https?:\/\/[^\s<>()]+/g

/** "Liên kết tham khảo (host)", or null when the text is not a valid http(s) address. */
function linkOf(raw: string) {
  const href = raw.replace(/[.,;:!?)\]]+$/, '')
  try {
    const url = new URL(href)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return { href, rest: raw.slice(href.length), label: `Liên kết tham khảo (${url.hostname.replace(/^www\./, '')})` }
  } catch {
    return null
  }
}

/** One paragraph with its raw URLs as safe external links; the text itself is never parsed as HTML. */
function withLinks(text: string): ReactNode[] {
  const parts: ReactNode[] = []
  let last = 0
  for (const match of text.matchAll(urlPattern)) {
    const link = linkOf(match[0])
    if (!link) continue
    parts.push(text.slice(last, match.index), (
      <a key={match.index} href={link.href} title={link.href} target="_blank" rel="noopener noreferrer">
        {link.label}
      </a>
    ), link.rest)
    last = match.index + match[0].length
  }
  parts.push(text.slice(last))
  return parts
}

/**
 * Imported notes arrive with separator lines ("-----", "====", "***") and runs of blank lines; shown as clean paragraphs.
 * Presentation only: the stored notes are untouched.
 */
function noteParagraphs(notes: string) {
  return notes
    .replaceAll('\r\n', '\n')
    .split(/\n\s*\n|\n\s*[-=_*~]{3,}\s*(?:\n|$)/)
    .map((paragraph) => paragraph.replace(/^[-=_*~\s]{3,}$/gm, '').replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean)
}

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
  const paragraphs = song.notes ? noteParagraphs(song.notes) : []
  return (
    <dl className="ct-facts">
      {facts.map(({ label, value }) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value || none}</dd>
        </div>
      ))}
      {paragraphs.length > 0 && (
        <div className="is-wide">
          <dt>Ghi chú</dt>
          <dd className="ct-facts__text">
            {paragraphs.map((paragraph, index) => (
              // Paragraphs of one note have no id; their order never changes while shown.
              <p key={index} className="ct-facts__para">{withLinks(paragraph)}</p>
            ))}
          </dd>
        </div>
      )}
    </dl>
  )
}
