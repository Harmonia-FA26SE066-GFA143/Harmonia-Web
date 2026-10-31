import { ArrowLeftOutlined, FileSearchOutlined } from '@ant-design/icons'
import { Button, Card, ConfigProvider, Flex, Typography } from 'antd'
import { generatePath, Link, useNavigate, useParams } from 'react-router'
import { readingTheme } from '@/app/theme'
import { paths } from '@/app/router/paths'
import { EventChoirsCard, LeadChoirNotice } from '@/features/choirs'
import { vietnamToday } from '@/lib/api/dates'
import { CardTitle, EmptyState, ErrorState, PageHeader, PageSkeleton, SectionSkeleton } from '@/shared/ui'
import { cardSurface, colors, spacing } from '@/styles/tokens'
import { DirectorPreparationHub } from '../components/DirectorPreparationHub'
import { PreparationSteps } from '../components/PreparationSteps'
import { ProgramHeader } from '../components/ProgramHeader'
import { ProgramItemList } from '../components/ProgramItemList'
import { SongListStatusTag } from '../components/SongListStatusTag'
import { useDirectorPreparation } from '../hooks/useDirectorPreparation'
import { useProgram } from '../hooks/usePrograms'
import { preparationSteps } from '../preparationSteps'
import { canEditSongList, type LiturgicalProgramDetail, type SongListStatus } from '../types'

const breadcrumb = [{ title: 'Ca trưởng' }, { title: 'Chương trình phụng vụ' }, { title: 'Chi tiết chương trình' }]

function songListAction(status?: SongListStatus): string {
  if (!status) return 'Đề xuất danh sách bài hát'
  return canEditSongList(status) ? 'Chỉnh sửa danh sách bài hát' : 'Xem danh sách đề xuất'
}

/** The six numbered steps with the page's one bookmark ribbon, from what the Choir Director may read (#246). */
function DirectorSteps({ program }: Readonly<{ program: LiturgicalProgramDetail }>) {
  const prep = useDirectorPreparation(program.id)
  const steps = preparationSteps({
    date: program.date,
    songListStatus: program.songListStatus,
    status: prep.data,
    failed: prep.isError,
    viewer: 'director',
  })
  return (
    <Card style={cardSurface} title={<CardTitle>Tiến trình chuẩn bị</CardTitle>}>
      {/* No ribbon until the counts arrive, so it never slides on load. */}
      {prep.isPending ? <SectionSkeleton rows={2} label="Đang tải tiến trình chuẩn bị" /> : <PreparationSteps steps={steps} bookmark />}
      {prep.isError && (
        <Flex align="center" gap={spacing.sm} wrap style={{ marginTop: spacing.md }}>
          <Typography.Text type="danger">Không thể tải tình hình chuẩn bị.</Typography.Text>
          <Button size="small" onClick={() => prep.refetch()} loading={prep.isFetching}>
            Thử lại
          </Button>
        </Flex>
      )}
    </Card>
  )
}

/**
 * Choir Director: one program read like a missal page (redesign brief 2026-10-31): the celebration in the display
 * serif, the six preparation steps, the songs in order, then the preparation hub that links rehearsals, attendance,
 * participation, roster and practice, and the serving choirs.
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
        actions={backButton}
      />
      {program.isError && (
        <ErrorState title="Không thể cập nhật chương trình" error={program.error} hasData onRetry={() => program.refetch()} retrying={program.isFetching} />
      )}
      <Flex vertical gap={spacing.lg}>
        <LeadChoirNotice eventId={data.id} />
        <DirectorSteps program={data} />

        <ConfigProvider theme={readingTheme}>
          {/* The ivory of readingTheme, so only the border comes from cardSurface. */}
          <Card
            style={{ border: cardSurface.border, boxShadow: 'none' }}
            title={
              <Flex align="center" gap={spacing.sm} wrap>
                <CardTitle>Chương trình</CardTitle> <SongListStatusTag status={data.songListStatus} />
              </Flex>
            }
            extra={
              <Button type="primary" onClick={openProposal}>
                {songListAction(data.songListStatus)}
              </Button>
            }
          >
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
          </Card>
        </ConfigProvider>

        <DirectorPreparationHub program={data} onOpenSongList={openProposal} />
        <EventChoirsCard eventId={data.id} locked={data.date < vietnamToday()} />
      </Flex>
    </>
  )
}
