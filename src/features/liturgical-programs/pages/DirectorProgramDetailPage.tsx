import { Button, ConfigProvider, Flex, Typography } from 'antd'
import { generatePath, Link, useNavigate, useParams } from 'react-router'
import { readingTheme } from '@/app/theme'
import { paths } from '@/app/router/paths'
import { EventChoirsCard, isPlanningDirector, LeadChoirNotice, useEventChoirs } from '@/features/choirs'
import { vietnamToday } from '@/lib/api/dates'
import { EmptyState, ErrorState, Icon, LostLeaf, PageHeader, PageSkeleton, SectionSkeleton, StatusTag, voicePartName } from '@/shared/ui'
import { colors, spacing } from '@/styles/tokens'
import { DirectorPreparationHub } from '../components/DirectorPreparationHub'
import { PreparationOverview } from '../components/PreparationOverview'
import { DirectorAdjacentNav } from '../components/AdjacentProgramNav'
import { ProgramHeader } from '../components/ProgramHeader'
import { ProgramItemList, type ProgramItem } from '../components/ProgramItemList'
import { SongListStatusTag } from '../components/SongListStatusTag'
import { usePreparationStatus } from '../hooks/useEvents'
import { useLiturgicalDays } from '../hooks/useLiturgicalDays'
import { useProgram } from '../hooks/usePrograms'
import { preparationItems } from '../preparationOverview'
import { canEditSongList, isSongListClosed, type LiturgicalProgramDetail, type SongListStatus } from '../types'

const breadcrumb = [
  { title: 'Ca trưởng' },
  { title: <Link to={paths.director.programs}>Chương trình phụng vụ</Link> },
  { title: 'Chi tiết chương trình' },
]

function songListAction(status: SongListStatus | undefined, readOnly: boolean): string {
  if (readOnly) return 'Xem danh sách đề xuất'
  if (!status) return 'Đề xuất danh sách bài hát'
  return canEditSongList(status) ? 'Chỉnh sửa danh sách bài hát' : 'Xem danh sách đề xuất'
}

/**
 * Independent preparation items from the status the Choir Director may read (#246), on the reading surface of the
 * side panel (artifact DirectorProgramDetailPage): one item per row, in their fixed reading order.
 */
function DirectorSteps({ program }: Readonly<{ program: LiturgicalProgramDetail }>) {
  const prep = usePreparationStatus(program.id)
  const items = preparationItems({
    date: program.date,
    songListStatus: program.songListStatus,
    status: prep.data,
    failed: prep.isError,
    viewer: 'director',
  })
  return (
    <section className="hm-preview hm-paper" aria-labelledby="program-prep">
      <h2 id="program-prep" className="hm-rubric">Tình hình chuẩn bị</h2>
      {prep.isPending ? <SectionSkeleton rows={2} label="Đang tải tình hình chuẩn bị" /> : <PreparationOverview items={items} columns={1} />}
      {prep.isError && (
        <Flex align="center" gap={spacing.sm} wrap>
          <Typography.Text type="danger">Không thể tải tình hình chuẩn bị.</Typography.Text>
          <Button size="small" onClick={() => prep.refetch()} loading={prep.isFetching}>
            Thử lại
          </Button>
        </Flex>
      )}
    </section>
  )
}

/**
 * Staffing of one part, from the shortages of `GET /api/liturgical-events/{id}/preparation-status`, matched by
 * song-list item (`RosterShortageDto.SongListItemId`; a whole-service role has neither id nor title, RosterService.cs:321-324).
 * Only once the list is approved, since the roster opens then; nothing while the status loads or if it failed.
 * The backend lists shortages only, so an unlisted part reads "Không thiếu nhân sự", never "full": the part may need
 * nobody at all (RosterService.cs:332-337).
 */
function StaffingMark({ program, item }: Readonly<{ program: LiturgicalProgramDetail; item: ProgramItem }>) {
  const prep = usePreparationStatus(program.id)
  if (program.songListStatus !== 'approved' || !prep.data) return null
  const shortages = prep.data.rosterShortages.filter((shortage) => shortage.songListItemId === item.id)
  if (shortages.length === 0) {
    // No roster yet means nothing has been checked against the requirements.
    if (prep.data.rosterFinalized === undefined) return null
    return (
      <Flex wrap gap={spacing.xs}>
        <StatusTag style={{ marginInlineEnd: 0 }}>Không thiếu nhân sự</StatusTag>
      </Flex>
    )
  }
  return (
    <Flex wrap align="center" gap={spacing.xs}>
      {shortages.map((shortage) => (
        <StatusTag key={shortage.skillName} color="gold" style={{ marginInlineEnd: 0 }}>
          {`Thiếu ${voicePartName(shortage.skillName)} (${shortage.assignedCount}/${shortage.requiredCount})`}
        </StatusTag>
      ))}
      <Link to={`${paths.director.roster}?programId=${program.id}`} style={{ fontSize: 13 }}>
        Phân công
      </Link>
    </Flex>
  )
}

/** The liturgical colour of the program's date, only when the synced calendar gives it (B64); otherwise neutral. */
function useDayTone(date: string) {
  const days = useLiturgicalDays(date, date)
  const day = days.data?.get(date)
  return { seasonKey: day?.seasonKey, color: day?.color }
}

/**
 * Choir Director: one program read like a missal page (artifact DirectorProgramDetailPage): the celebration in the
 * display serif; the songs in liturgical order with what each part already has (files, staffing) on the reading
 * surface; the preparation hub that links rehearsals, attendance, participation, roster and practice; beside them the
 * independent preparation signals and the serving choirs.
 */
export function DirectorProgramDetailPage() {
  const navigate = useNavigate()
  const { programId = '' } = useParams()
  const program = useProgram(programId)
  const backButton = (
    <Button icon={<Icon name="arrow-left" />} onClick={() => navigate(paths.director.programs)}>
      Về danh sách
    </Button>
  )

  if (program.isPending) return <PageSkeleton sections={2} />
  if (!program.data) {
    return (
      <>
        <PageHeader title="Chi tiết chương trình phụng vụ" breadcrumb={breadcrumb} />
        {program.isError ? (
          <ErrorState title="Không thể tải chương trình" error={program.error} hasData={program.data !== undefined} onRetry={() => program.refetch()} retrying={program.isFetching} />
        ) : (
          <EmptyState
            icon={<LostLeaf />}
            title="Không tìm thấy chương trình phụng vụ"
            description="Chương trình không tồn tại, đã bị hủy hoặc đường dẫn không đúng."
            action={backButton}
          />
        )}
      </>
    )
  }

  return <ProgramDetail data={program.data} program={program} />
}

/** The loaded program; split out so the calendar day is read only once the date is known. */
function ProgramDetail({
  data,
  program,
}: Readonly<{ data: LiturgicalProgramDetail; program: ReturnType<typeof useProgram> }>) {
  const navigate = useNavigate()
  const tone = useDayTone(data.date)
  const choirs = useEventChoirs(data.id)
  const planner = choirs.data ? isPlanningDirector(choirs.data) : true
  const readOnly = isSongListClosed(data) || !planner
  const canActOnList = !readOnly && (!data.songListStatus || canEditSongList(data.songListStatus))
  const openProposal = () => navigate(generatePath(paths.director.songListProposal, { programId: data.id }))
  const details = [
    data.massTypeName !== data.eventName && data.massTypeName,
    data.ceremonyTypeName !== data.eventName && data.ceremonyTypeName,
    data.specialRequirements && `Yêu cầu đặc biệt: ${data.specialRequirements}`,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <>
      <ProgramHeader
        title={data.eventName}
        date={data.date}
        time={data.time}
        place={data.locationName}
        seasonName={data.seasonName}
        seasonKey={tone.seasonKey}
        color={tone.color}
        details={details || undefined}
        breadcrumb={breadcrumb}
        actions={
          <>
            <DirectorAdjacentNav id={data.id} date={data.date} />
          </>
        }
      />
      {program.isError && (
        <ErrorState title="Không thể cập nhật chương trình" error={program.error} hasData onRetry={() => program.refetch()} retrying={program.isFetching} />
      )}
      <LeadChoirNotice eventId={data.id} />
      <div className="hm-split ct-detail">
        <div className="ct-main">
          <ConfigProvider theme={readingTheme}>
            <section className="hm-sheet-section ct-reading" aria-labelledby="program-songs">
              <div className="hm-sheet-section__head">
                <Flex align="center" gap={spacing.sm} wrap>
                  <h2 id="program-songs" className="hm-rubric">Thứ tự phụng vụ</h2>
                  <SongListStatusTag status={data.songListStatus} />
                </Flex>
                <Button type={canActOnList ? 'primary' : 'default'} onClick={openProposal}>
                  {songListAction(data.songListStatus, readOnly)}
                </Button>
              </div>
              <div className="ct-reading__body">
                {data.songs.length > 0 && data.songListStatus !== 'approved' && (
                  // Said once for the whole list, in words true for a draft, a pending review or a returned list alike.
                  <Typography.Text style={{ display: 'block', paddingTop: spacing.sm, color: colors.textMuted, fontSize: 13 }}>
                    Phân công phục vụ cho từng phần mở sau khi danh sách được duyệt.
                  </Typography.Text>
                )}
                {data.songs.length > 0 ? (
                  <ProgramItemList
                    items={data.songs.map(({ id, songId, liturgicalPart, title, note }) => ({ id, songId, slotName: liturgicalPart, title, note }))}
                    showMaterials
                    renderStatus={(item) => <StaffingMark program={data} item={item} />}
                    renderAction={(item) =>
                      item.songId && (
                        <Link to={generatePath(paths.director.songDetail, { songId: item.songId })} aria-label={`Xem bài ${item.title}`} style={{ fontWeight: 500 }}>
                          Xem bài
                        </Link>
                      )
                    }
                  />
                ) : (
                  // The section head holds the one action that starts the list (SYS-06), so this only explains it.
                  <EmptyState
                    headingLevel={3}
                    title="Chưa có danh sách bài hát"
                    description="Chọn bài cho từng phần phụng vụ từ kho bài hát rồi gửi Cha xứ duyệt; sau khi duyệt, bạn phân công phục vụ và giao bài luyện tập."
                  />
                )}
              </div>
            </section>
          </ConfigProvider>
          <DirectorPreparationHub program={data} />
        </div>
        <aside className="ct-aside" aria-label="Chuẩn bị và ca đoàn phục vụ">
          <DirectorSteps program={data} />
          <EventChoirsCard eventId={data.id} locked={data.date < vietnamToday()} />
        </aside>
      </div>
    </>
  )
}
