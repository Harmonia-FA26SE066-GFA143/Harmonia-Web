import { ArrowLeftOutlined, FileSearchOutlined } from '@ant-design/icons'
import { Button, Card, Flex, Typography } from 'antd'
import { generatePath, useNavigate, useParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { EmptyState, ErrorState, PageHeader, PageSkeleton } from '@/shared/ui'
import { colors, spacing } from '@/styles/tokens'
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

/** Operational areas built in Phase 6 (FE-26, FE-35–FE-46); shown as reserved space for now. */
const upcomingAreas = ['Lịch tập', 'Yêu cầu nhân sự & phân công', 'Bài tập luyện tập']

/**
 * Choir Director: one program with its FE-16 information and song list (FE-20, FE-30). Rehearsals, staffing,
 * roster and practice blocks arrive in Phase 6. Not built: the five-step progress bar (team decision 2026-09-26).
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
  if (program.isError || !program.data) {
    return (
      <>
        <PageHeader title="Chi tiết chương trình phụng vụ" breadcrumb={breadcrumb} extra={backButton} />
        {program.isError ? (
          <ErrorState title="Không thể tải chương trình" onRetry={() => program.refetch()} retrying={program.isFetching} />
        ) : (
          <EmptyState
            icon={<FileSearchOutlined />}
            title="Không tìm thấy chương trình phụng vụ"
            description="Chương trình không tồn tại hoặc đường dẫn không đúng."
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
        description={[formatProgramDate(data.date), data.season?.name].filter(Boolean).join(' • ')}
        extra={backButton}
      />
      <Flex vertical gap={spacing.lg}>
        <ProgramInfo program={data} />
        <Card
          title={
            <Flex align="center" gap={spacing.sm} wrap>
              Danh sách bài hát <SongListStatusTag status={data.songListStatus} />
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
              Chưa có danh sách bài hát. Chọn bài từ kho và gửi Cha xứ / Ban phụng vụ duyệt.
            </Typography.Text>
          )}
        </Card>
        <Card title="Chuẩn bị phục vụ">
          <Flex vertical gap={spacing.xs}>
            {upcomingAreas.map((area) => (
              <Typography.Text key={area}>
                {area}: <span style={{ color: colors.textMuted }}>sẽ được bổ sung.</span>
              </Typography.Text>
            ))}
          </Flex>
        </Card>
      </Flex>
    </>
  )
}
