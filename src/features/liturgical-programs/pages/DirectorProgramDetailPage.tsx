import { ArrowLeftOutlined, FileSearchOutlined } from '@ant-design/icons'
import { Button, Card, Flex, Typography } from 'antd'
import { generatePath, useNavigate, useParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { EventChoirsCard } from '@/features/choirs'
import { vietnamToday } from '@/lib/api/dates'
import { CardTitle, EmptyState, ErrorState, PageHeader, PageSkeleton } from '@/shared/ui'
import { colors, spacing } from '@/styles/tokens'
import { DirectorPreparationHub } from '../components/DirectorPreparationHub'
import { ProgramInfo } from '../components/ProgramInfo'
import { ProgramSongTable } from '../components/ProgramSongTable'
import { SongListStatusTag } from '../components/SongListStatusTag'
import { useProgram } from '../hooks/usePrograms'
import { formatProgramDate } from '../programFilters'
import { canEditSongList, type SongListStatus } from '../types'

const breadcrumb = [{ title: 'Ca trưởng' }, { title: 'Chương trình phụng vụ' }, { title: 'Chi tiết chương trình' }]

function songListAction(status?: SongListStatus): string {
  if (!status) return 'Đề xuất danh sách bài hát'
  return canEditSongList(status) ? 'Chỉnh sửa danh sách bài hát' : 'Xem danh sách đề xuất'
}

/**
 * Choir Director: one program with its FE-16 information, song list (FE-20, FE-30), and preparation hub
 * connecting rehearsals, attendance, participation, roster, and practice readiness.
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

  return (
    <>
      <PageHeader
        title={data.eventName}
        breadcrumb={breadcrumb}
        description={[formatProgramDate(data.date), data.seasonName].filter(Boolean).join(' • ')}
        extra={backButton}
      />
      {program.isError && (
        <ErrorState title="Không thể cập nhật chương trình" error={program.error} hasData onRetry={() => program.refetch()} retrying={program.isFetching} />
      )}
      <Flex vertical gap={spacing.lg}>
        <DirectorPreparationHub program={data} onOpenSongList={openProposal} />

        <ProgramInfo program={data} />
        <EventChoirsCard eventId={data.id} locked={data.date < vietnamToday()} />

        <Card
          title={
            <Flex align="center" gap={spacing.sm} wrap>
              <CardTitle>Danh sách bài hát</CardTitle> <SongListStatusTag status={data.songListStatus} />
            </Flex>
          }
          extra={
            <Button type="primary" onClick={openProposal}>
              {songListAction(data.songListStatus)}
            </Button>
          }
          styles={{ body: { padding: data.songs.length > 0 ? 0 : spacing.lg } }}
        >
          {data.songs.length > 0 ? (
            <ProgramSongTable songs={data.songs} />
          ) : (
            <Typography.Text style={{ color: colors.textMuted }}>
              Chưa có danh sách bài hát. Chọn bài từ kho và gửi Cha xứ duyệt.
            </Typography.Text>
          )}
        </Card>
      </Flex>
    </>
  )
}
