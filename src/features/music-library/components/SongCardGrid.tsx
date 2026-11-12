import { Pagination, Spin } from 'antd'
import { useState } from 'react'
import { visuallyHidden } from '@/shared/ui'
import { cardMaterials, songMeta, usageText } from '../songCard'
import type { Song } from '../types'

const blankStaves = [44, 74, 104, 134, 164, 194]

/**
 * A sheet with nothing written yet, in the empty-state motif (artifact Motifs, staff-empty): four-line staves with a
 * C clef at the head and a custos at the end, a dashed edge, and the words. Drawn, so it never fails to load.
 */
function BlankScorePage({ className }: Readonly<{ className: string }>) {
  return (
    <svg aria-hidden className={`${className} is-blank`} viewBox="0 0 160 220" width={160} height={220}>
      <rect x={0.5} y={0.5} width={159} height={219} fill="var(--hm-surface-base)" stroke="var(--hm-border-control)" strokeDasharray="4 3" />
      {blankStaves.map((top) => (
        <g key={top}>
          <g stroke="var(--hm-action-primary)" strokeOpacity={0.3}>
            {[0, 6, 12, 18].map((dy) => (
              <line key={dy} x1={12} x2={148} y1={top + dy + 0.5} y2={top + dy + 0.5} />
            ))}
          </g>
          <g fill="var(--hm-action-primary)" fillOpacity={0.45}>
            <rect x={15} y={top + 3} width={4} height={3} />
            <rect x={15} y={top + 9} width={4} height={3} />
            <rect x={14} y={top + 3} width={1} height={9} />
            <rect x={141} y={top + 9} width={3} height={4} />
            <rect x={143} y={top + 2} width={0.8} height={8} />
          </g>
        </g>
      ))}
      <rect x={34} y={18} width={92} height={18} rx={3} fill="var(--hm-surface-reading)" stroke="var(--hm-border-control)" strokeDasharray="3 2" />
      <text x={80} y={30.5} textAnchor="middle" fontSize={9.5} fill="var(--hm-text-muted)" style={{ fontFamily: 'var(--hm-font-ui)' }}>
        Chưa có bản nhạc
      </text>
    </svg>
  )
}

/** Page 1 of the score on parchment; a blank sheet when there is none or it fails to load. */
export function ScorePage({ url, className = 'song-card__page' }: Readonly<{ url?: string | null; className?: string }>) {
  const [failed, setFailed] = useState(false)
  if (!url || failed) return <BlankScorePage className={className} />
  return <img className={className} src={url} alt="" width={160} height={220} loading="lazy" onError={() => setFailed(true)} />
}

export interface SongCardGridProps {
  songs: Song[]
  page: number
  pageSize: number
  total: number
  loading?: boolean
  selectedId?: string
  /** Mass part per song, when the slot filter or the next Mass's list gives one; the song list itself has none. */
  partOf: (song: Song) => string | undefined
  /** Changes when the filters change, so the cards rise in again. */
  animationKey: string
  onSelect: (song: Song) => void
  onPageChange: (page: number) => void
}

/**
 * The library as score-page cards (artifact SongLibraryPage): the first page of the sheet, the index number, the part,
 * title, credits, materials as filled or empty dots with words, and how often the song was sung. A card picks the song
 * for the quick look beside the grid.
 */
export function SongCardGrid({ songs, page, pageSize, total, loading, selectedId, partOf, animationKey, onSelect, onPageChange }: Readonly<SongCardGridProps>) {
  return (
    <Spin spinning={loading}>
      <ul key={animationKey} className="song-cards hm-stagger" aria-label="Bài hát">
        {songs.map((song, index) => {
          const part = partOf(song)
          return (
            <li key={song.id}>
              <button type="button" className="song-card hm-lift" aria-pressed={song.id === selectedId} onClick={() => onSelect(song)}>
                <span className="song-card__thumb" aria-hidden>
                  <ScorePage url={song.sheetMusicThumbnailUrl} />
                  <span className="song-card__no">{(page - 1) * pageSize + index + 1}</span>
                </span>
                <span className="song-card__body">
                  {part && <span className="song-card__part">{part}</span>}
                  <b className="song-card__title">{song.title}</b>
                  <span className="song-card__meta">{songMeta(song)}</span>
                  {song.materialCounts && (
                    <span className="song-card__mats">
                      {cardMaterials.map(({ kind, label }) => {
                        const has = (song.materialCounts?.[kind] ?? 0) > 0
                        return (
                          <span key={kind} className={has ? undefined : 'is-miss'}>
                            <span aria-hidden>{has ? '●' : '○'}</span> {!has && <span style={visuallyHidden}>Chưa có </span>}
                            {label}
                          </span>
                        )
                      })}
                    </span>
                  )}
                  <span className="song-card__used">{usageText(song)}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <div className="song-cards__pager">
        <Pagination current={page} pageSize={pageSize} total={total} showSizeChanger={false} onChange={onPageChange} />
      </div>
    </Spin>
  )
}
