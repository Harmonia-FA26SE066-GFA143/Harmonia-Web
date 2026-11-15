import { ArrowLeftOutlined, FileSearchOutlined } from '@ant-design/icons'
import { Button, ConfigProvider, Flex, Typography } from 'antd'
import { generatePath, Link, useNavigate, useParams } from 'react-router'
import { readingTheme } from '@/app/theme'
import { paths } from '@/app/router/paths'
import { EventChoirsCard, LeadChoirNotice } from '@/features/choirs'
import { vietnamToday } from '@/lib/api/dates'
import { EmptyState, ErrorState, PageHeader, PageSkeleton, SectionSkeleton } from '@/shared/ui'
import { colors, spacing } from '@/styles/tokens'
import { DirectorPreparationHub } from '../components/DirectorPreparationHub'
import { PreparationOverview } from '../components/PreparationOverview'
import { DirectorAdjacentNav } from '../components/AdjacentProgramNav'
import { ProgramHeader } from '../components/ProgramHeader'
import { ProgramItemList } from '../components/ProgramItemList'
import { SongListStatusTag } from '../components/SongListStatusTag'
import { usePreparationStatus } from '../hooks/useEvents'
import { useProgram } from '../hooks/usePrograms'
import { preparationItems } from '../preparationOverview'
import { canEditSongList, type LiturgicalProgramDetail, type SongListStatus } from '../types'

const breadcrumb = [{ title: 'Ca trưởng' }, { title: 'Chương trình phụng vụ' }, { title: 'Chi tiết chương trình' }]

function songListAction(status?: SongListStatus): string {
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
 * Choir Director: one program read like a missal page (artifact DirectorProgramDetailPage): the celebration in the
 * display serif; the songs in order on the reading surface and the preparation hub that links rehearsals, attendance,
 * participation, roster and practice; beside them the independent preparation signals and the serving choirs.
 */
export function DirectorProgramDetailPage() {
  const navigate = useNavigate()
  const { programId = '' } = useParams()
  const program = useProgram(programId)
  const backButton = (
    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(paths.director.programs)}>
      Về danh sách
    </Button>
  )

  if (program.isPending) return <PageSkeleton sections={2} />
  if (!program.data) {
    return (
      <>
        <PageHeader title="Chi tiết chương trình phụng vụ" breadcrumb={breadcrumb} extra={backButton} />
        {program.isError ? (
          <ErrorState title="Không thể tải chương trình" error={program.error} hasData={program.data !== undefined} onRetry={() => program.refetch()} retrying={program.isFetching} />
        ) : (
          <EmptyState
            icon={<FileSearchOutlined />}
            title="Không tìm thấy chương trình phụng vụ"
            description="Chương trình không tồn tại, đã bị hủy hoặc đường dẫn không đúng."
            action={backButton}
          />
        )}
      </>
    )
  }

  const { data } = program
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
        details={details || undefined}
        breadcrumb={breadcrumb}
        actions={
          <>
            <DirectorAdjacentNav id={data.id} date={data.date} />
            {backButton}
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
                  <h2 id="program-songs" className="hm-rubric">Chương trình</h2>
                  <SongListStatusTag status={data.songListStatus} />
                </Flex>
                <Button type="primary" onClick={openProposal}>
                  {songListAction(data.songListStatus)}
                </Button>
              </div>
              <div className="ct-reading__body">
                {data.songs.length > 0 ? (
                  <ProgramItemList
                    items={data.songs.map(({ id, songId, liturgicalPart, title, note }) => ({ id, songId, slotName: liturgicalPart, title, note }))}
                    renderAction={(item) =>
                      item.songId && (
                        <Link to={generatePath(paths.director.songDetail, { songId: item.songId })} aria-label={`Xem bài ${item.title}`} style={{ fontWeight: 500 }}>
                          Xem bài
                        </Link>
                      )
                    }
                  />
                ) : (
                  <Typography.Text style={{ color: colors.textMuted }}>
                    Chưa có danh sách bài hát. Chọn bài từ kho và gửi Cha xứ duyệt.
                  </Typography.Text>
                )}
              </div>
            </section>
          </ConfigProvider>
          <DirectorPreparationHub program={data} onOpenSongList={openProposal} />
        </div>
        <aside className="ct-aside" aria-label="Chuẩn bị và ca đoàn phục vụ">
          <DirectorSteps program={data} />
          <EventChoirsCard eventId={data.id} locked={data.date < vietnamToday()} />
        </aside>
      </div>
    </>
  )
}
