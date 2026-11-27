import dayjs from 'dayjs'
import type { ReactNode } from 'react'
import { generatePath, Link } from 'react-router'
import { paths } from '@/app/router/paths'
import { parseUtc } from '@/lib/api/dates'
import { SongListStatusTag, useNextProgram } from '@/features/liturgical-programs'
import { useAllAssignments } from '@/features/practice'
import { formatRehearsalTime, useAllRehearsals } from '@/features/rehearsals'
import { useSongList } from '@/features/song-lists'
import { CREATE_ASSIGNMENT_LABEL, ErrorState, Icon, SectionSkeleton, UNKNOWN_METRIC_LABEL } from '@/shared/ui'
import type { Song } from '../types'

function Group({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <div className="song-usage__group">
      <h3 className="song-usage__title">{title}</h3>
      {children}
    </div>
  )
}

function History({ song }: Readonly<{ song: Song }>) {
  if (song.timesUsed === undefined) return <p className="song-usage__empty">{UNKNOWN_METRIC_LABEL}</p>
  if (song.timesUsed === 0) return <p className="song-usage__empty">Chưa dùng trong Thánh lễ đã công bố nào</p>
  return (
    <p className="song-usage__line">
      <b>Đã dùng {song.timesUsed} lần</b>
      {song.lastUsedDate && <span> · Gần nhất: {dayjs(song.lastUsedDate).format('DD/MM/YYYY')}</span>}
    </p>
  )
}

/**
 * Where the song is used, from what a Choir Director may read: SongDto `timesUsed`/`lastUsedDate` (past published
 * Masses), the next Mass's song list, rehearsals (GET /api/rehearsals `songs`) and practice assignments
 * (GET /api/practice-assignments `songId`). GET /api/reports/song-usage is Priest/Admin only (403), so it is never called.
 */
export function SongUsagePanel({ song }: Readonly<{ song: Song }>) {
  const nextProgram = useNextProgram()
  const nextList = useSongList(nextProgram?.id ?? '', { enabled: Boolean(nextProgram) })
  const nextItem = nextList.data?.items.find((item) => item.songId === song.id)
  // ponytail: reads every rehearsal page and filters by song client-side; a songId filter on GET /api/rehearsals would lift it.
  const rehearsals = useAllRehearsals({})
  // ponytail: reads every assignment page and filters by song client-side; a songId filter on GET /api/practice-assignments would lift it.
  const assignments = useAllAssignments()
  const usedIn = (rehearsals.data?.items ?? []).filter((rehearsal) => rehearsal.songs.some((item) => item.songId === song.id))
  const assigned = (assignments.data?.items ?? []).filter((assignment) => assignment.songId === song.id)
  const assignLink = `${paths.director.practiceNew}?songId=${song.id}`

  return (
    <div className="song-usage">
      <Group title="Lịch sử sử dụng">
        <History song={song} />
      </Group>

      {nextProgram && nextItem && (
        <Group title="Thánh lễ sắp tới">
          <Link className="song-usage__next" to={generatePath(paths.director.programDetail, { programId: nextProgram.id })}>
            <b>{nextProgram.eventName}</b>
            <span>
              {dayjs(nextProgram.date).format('DD/MM/YYYY')} {nextProgram.time} · {nextItem.slotName}
            </span>
            <SongListStatusTag status={nextProgram.songListStatus} />
          </Link>
        </Group>
      )}

      <Group title="Buổi tập có bài này">
        {rehearsals.isPending && <SectionSkeleton rows={2} label="Đang tải buổi tập" />}
        {rehearsals.isError && (
          <ErrorState headingLevel={3} title="Không thể tải buổi tập" error={rehearsals.error} hasData={false} onRetry={() => rehearsals.refetch()} retrying={rehearsals.isFetching} />
        )}
        {rehearsals.data && usedIn.length === 0 && <p className="song-usage__empty">Chưa có buổi tập nào chọn bài này</p>}
        {usedIn.length > 0 && (
          <ul className="song-usage__list">
            {usedIn.map((rehearsal) => (
              <li key={rehearsal.id}>
                <Link className="song-usage__item" to={generatePath(paths.director.rehearsalDetail, { rehearsalId: rehearsal.id })}>
                  <span>{formatRehearsalTime(rehearsal)}</span>
                  {rehearsal.locationName && <small>{rehearsal.locationName}</small>}
                  <Icon name="arrow-right" className="song-usage__arrow" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Group>

      <Group title="Bài tập luyện tập">
        {assignments.isPending && <SectionSkeleton rows={2} label="Đang tải bài tập" />}
        {assignments.isError && (
          <ErrorState headingLevel={3} title="Không thể tải bài tập" error={assignments.error} hasData={false} onRetry={() => assignments.refetch()} retrying={assignments.isFetching} />
        )}
        {assignments.data && assigned.length === 0 && <p className="song-usage__empty">Chưa có bài tập nào cho bài này</p>}
        {assigned.length > 0 && (
          <ul className="song-usage__list">
            {assigned.map((assignment) => (
              <li key={assignment.id}>
                <Link className="song-usage__item" to={`${paths.director.practice}?tab=assignments`}>
                  <span>{assignment.title}</span>
                  <small>Hạn {dayjs(parseUtc(assignment.dueDate)).format('DD/MM/YYYY')}</small>
                  <Icon name="arrow-right" className="song-usage__arrow" />
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link className="song-usage__assign" to={assignLink}>
          <Icon name="assignment" /> {CREATE_ASSIGNMENT_LABEL}
        </Link>
      </Group>
    </div>
  )
}
