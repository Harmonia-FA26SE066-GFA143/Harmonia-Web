import { ArrowRightOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { generatePath, Link } from 'react-router'
import { paths } from '@/app/router/paths'
import { massTimeLabels, massTimeOf, songListStatusLabels, type LiturgicalProgram } from '@/features/liturgical-programs'
import type { SongList } from '@/features/song-lists'

/**
 * The next Mass's songs by part, read from its song list (artifact SongLibraryPage, "Bài cho Lễ sắp tới"). A list not
 * started yet is one dashed "Chưa chọn bài nào", never red. Links to the proposal.
 */
export function NextMassSongs({ program, list }: Readonly<{ program: LiturgicalProgram; list: SongList | null | undefined }>) {
  const hour = massTimeOf(program.time)
  const status = program.songListStatus ? songListStatusLabels[program.songListStatus].toLowerCase() : 'chưa có danh sách'
  const items = list?.items ?? []

  return (
    <section className="song-next" aria-label="Bài cho Lễ sắp tới">
      <header className="song-next__head">
        <h2 className="hm-rubric" style={{ margin: 0 }}>Bài cho Lễ sắp tới</h2>
        <span className="song-card__meta">
          {program.eventName} · {hour ? `${massTimeLabels[hour]} ` : ''}{dayjs(program.date).format('DD/MM')} {program.time} · {status}
        </span>
        <Link className="song-next__open" to={generatePath(paths.director.songListProposal, { programId: program.id })}>
          Mở đề xuất <ArrowRightOutlined aria-hidden />
        </Link>
      </header>
      <ul className="song-next__row">
        {items.length === 0 ? (
          <li className="song-next__item is-gap">
            <span className="song-next__part">Danh sách bài hát</span>
            <b>Chưa chọn bài nào</b>
          </li>
        ) : (
          items.map((item) => (
            <li key={item.id}>
              <Link className="song-next__item" to={generatePath(paths.director.songDetail, { songId: item.songId })}>
                <span className="song-next__part">{item.slotName}</span>
                <b>{item.songTitle}</b>
              </Link>
            </li>
          ))
        )}
      </ul>
    </section>
  )
}
