import { Button, Flex, Tooltip } from 'antd'
import { useState } from 'react'
import type { MouseEvent } from 'react'
import { generatePath, Link, useLocation, useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { CREATE_ASSIGNMENT_LABEL, Icon, MATERIAL_LABELS, type IconName } from '@/shared/ui'
import { useSongMaterials } from '../hooks/useSongs'
import { songListState } from '../songFilters'
import { isPlayableAudio, type MaterialKind, type Song, type SongMaterial } from '../types'
import { LearningProgressDrawer } from './LearningProgressDrawer'
import { materialKinds, songMeta, usageText } from '../songCard'
import { ScorePage } from './SongCardGrid'

const audioKinds = new Set<MaterialKind>(['sampleAudio', 'interactiveScore'])
const kindIcons: Record<MaterialKind, IconName> = {
  sheetMusic: 'sheet-music',
  lyrics: 'lyrics',
  sampleAudio: 'audio',
  rehearsalMaterial: 'folder-open',
  interactiveScore: 'play',
}

/** What the material's link does: upload one when there is none, else listen to audio or open the rest. */
function materialAction(kind: MaterialKind, count: number) {
  if (!count) return 'Tải lên'
  return audioKinds.has(kind) ? 'Nghe' : 'Mở'
}

/**
 * The picked song beside the grid (artifact SongLibraryPage, quick look): its score page, number and part, credits,
 * the sample audio when it has one, its materials by kind, how often it was sung, and the ways on.
 */
export function SongQuickLook({ song, number, part }: Readonly<{ song: Song; number: number; part?: string }>) {
  const { search } = useLocation()
  const navigate = useNavigate()
  // Real links (open in a new tab works), followed in the app on a plain click.
  const go = (to: string, state?: unknown) => (event: MouseEvent) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey) return
    event.preventDefault()
    navigate(to, { state })
  }
  const materials = useSongMaterials(song.id)
  const [progressOf, setProgressOf] = useState<SongMaterial>()
  const audio = materials.data?.find((material) => material.kind === 'sampleAudio' && material.url && isPlayableAudio(material))
  // Learning progress is per material; the sheet music is what a singer learns first.
  const learnable = materials.data?.find((material) => material.kind === 'sheetMusic') ?? materials.data?.[0]
  const detail = generatePath(paths.director.songDetail, { songId: song.id })
  const assign = `${paths.director.practiceNew}?songId=${song.id}`
  const credits = [song.composer && `Nhạc: ${song.composer}`, song.lyricist && song.lyricist !== song.composer && `Lời: ${song.lyricist}`]

  return (
    <aside className="song-peek" aria-label="Xem nhanh bài hát">
      <div key={song.id} className="song-peek__in">
        <div className="song-peek__page" aria-hidden>
          <ScorePage
            url={song.sheetMusicThumbnailUrl}
            hasScore={(song.materialCounts?.sheetMusic ?? 0) > 0 || (song.materialCounts?.interactiveScore ?? 0) > 0}
            interactive={(song.materialCounts?.interactiveScore ?? 0) > 0}
            keySignature={song.musicalKey}
            className="song-peek__sheet"
          />
        </div>
        <div className="song-peek__body">
          <span className="song-card__meta">Mục {number}{part ? ` · ${part}` : ''}</span>
          <h2 className="song-peek__title">{song.title}</h2>
          <p className="song-card__meta" style={{ margin: 0 }}>
            {[...credits, song.musicalKey, song.tempo].filter(Boolean).join(' · ') || songMeta(song)}
          </p>
          {audio?.url && (
            // The signed URL renews when the materials are fetched again; no captions exist for a sample recording.
            <audio className="song-peek__audio" controls preload="none" src={audio.url} aria-label={`Audio mẫu: ${audio.title}`}>
              <track kind="captions" />
            </audio>
          )}
          <ul className="song-peek__files">
            {materialKinds.map((kind) => {
              const count = song.materialCounts?.[kind] ?? 0
              return (
                <li key={kind} className={count ? undefined : 'is-miss'}>
                  <Icon name={kindIcons[kind]} />
                  <span>
                    {MATERIAL_LABELS[kind]}
                    <small>{count ? `${count} tệp` : 'Chưa có'}</small>
                  </span>
                  <Link
                    to={`${detail}#materials-${kind}`}
                    state={songListState(search)}
                    aria-label={`${materialAction(kind, count)} ${MATERIAL_LABELS[kind].toLowerCase()} của ${song.title}`}
                  >
                    {materialAction(kind, count)}
                  </Link>
                </li>
              )
            })}
          </ul>
          <span className="song-card__meta">{usageText(song)}</span>
          <Flex gap={8} wrap>
            <Button type="primary" href={detail} onClick={go(detail, songListState(search))}>
              Mở chi tiết
            </Button>
            <Button href={assign} icon={<Icon name="assignment" />} onClick={go(assign)}>
              {CREATE_ASSIGNMENT_LABEL}
            </Button>
            <Tooltip
              title={learnable ? `Xem tiến độ học của “${learnable.title}”` : 'Bài hát chưa có tài liệu để theo dõi tiến độ'}
              trigger={['hover', 'focus']}
            >
              <Button type="link" disabled={!learnable} onClick={() => setProgressOf(learnable)}>
                Tiến độ học
              </Button>
            </Tooltip>
          </Flex>
        </div>
      </div>
      <LearningProgressDrawer material={progressOf} onClose={() => setProgressOf(undefined)} />
    </aside>
  )
}
