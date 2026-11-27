import { Pagination, Spin } from 'antd'
import { useState } from 'react'
import { Icon, MATERIAL_LABELS, paginationTotal, visuallyHidden } from '@/shared/ui'
import { materialKinds, songMeta, usageText } from '../songCard'
import type { Song } from '../types'

/**
 * A plain sheet where the score's first page would be when no score has been uploaded yet.
 */
function BlankScorePage({ className }: Readonly<{ className: string }>) {
  return (
    <span className={`${className} is-blank`} aria-hidden>
      <Icon name="sheet-music" size="lg" />
      <span>Chưa có bản nhạc</span>
    </span>
  )
}

/**
 * When a song already has a PDF or interactive score (`materialCounts.sheetMusic > 0` or `interactiveScore > 0`)
 * without a separate raster thumbnail, show a calm ruled choir octavo leaf instead of falsely claiming "Chưa có bản nhạc".
 */
function ManuscriptScorePage({
  className,
  interactive,
  keySignature,
}: Readonly<{ className: string; interactive?: boolean; keySignature?: string | null }>) {
  return (
    <span className={`${className} is-manuscript`} aria-hidden>
      <span className="song-score-leaf__head">
        <Icon name={interactive ? 'play' : 'sheet-music'} size="sm" />
        <span>{interactive ? 'Bản nhạc tương tác' : 'Tổng phổ'}</span>
      </span>
      <span className="song-score-leaf__staves">
        <i />
        <i />
        <i />
      </span>
      {keySignature && <span className="song-score-leaf__key">{keySignature}</span>}
    </span>
  )
}

/** Page 1 of the score on parchment; a ruled score leaf when a PDF/MEI exists without thumbnail, or blank when none. */
export function ScorePage({
  url,
  hasScore = false,
  interactive = false,
  keySignature,
  className = 'song-card__page',
}: Readonly<{ url?: string | null; hasScore?: boolean; interactive?: boolean; keySignature?: string | null; className?: string }>) {
  const [failed, setFailed] = useState(false)
  if (!url || failed) {
    return hasScore ? (
      <ManuscriptScorePage className={className} interactive={interactive} keySignature={keySignature} />
    ) : (
      <BlankScorePage className={className} />
    )
  }
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
  onOpen?: (song: Song) => void
  onPageChange: (page: number) => void
}

/**
 * The library as score-page cards (artifact SongLibraryPage): the first page of the sheet, the index number, the part,
 * title, credits, materials as filled or empty dots with words, and how often the song was sung. A card picks the song
 * for the quick look beside the grid.
 */
export function SongCardGrid({ songs, page, pageSize, total, loading, selectedId, partOf, animationKey, onSelect, onOpen, onPageChange }: Readonly<SongCardGridProps>) {
  return (
    <Spin spinning={loading}>
      <ul key={animationKey} className="song-cards hm-stagger" aria-label="Bài hát">
        {songs.map((song, index) => {
          const part = partOf(song)
          return (
            <li key={song.id} data-row-key={song.id}>
              <button
                type="button"
                className="song-card hm-lift"
                aria-pressed={song.id === selectedId}
                onClick={() => onSelect(song)}
                onDoubleClick={() => onOpen?.(song)}
              >
                <span className="song-card__thumb" aria-hidden>
                  <ScorePage
                    url={song.sheetMusicThumbnailUrl}
                    hasScore={(song.materialCounts?.sheetMusic ?? 0) > 0 || (song.materialCounts?.interactiveScore ?? 0) > 0}
                    interactive={(song.materialCounts?.interactiveScore ?? 0) > 0}
                    keySignature={song.musicalKey}
                  />
                  <span className="song-card__no">{(page - 1) * pageSize + index + 1}</span>
                </span>
                <span className="song-card__body">
                  {part && <span className="song-card__part">{part}</span>}
                  <b className="song-card__title">{song.title}</b>
                  <span className="song-card__meta">{songMeta(song)}</span>
                  {song.materialCounts && (
                    <span className="song-card__mats">
                      {materialKinds.map((kind) => {
                        const has = (song.materialCounts?.[kind] ?? 0) > 0
                        return (
                          <span key={kind} className={has ? undefined : 'is-miss'}>
                            <span aria-hidden>{has ? '●' : '○'}</span> {!has && <span style={visuallyHidden}>Chưa có </span>}
                            {MATERIAL_LABELS[kind]}
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
        <Pagination
          current={page}
          pageSize={pageSize}
          total={total}
          hideOnSinglePage
          showSizeChanger={false}
          showTotal={paginationTotal('bài hát')}
          onChange={onPageChange}
        />
      </div>
    </Spin>
  )
}
