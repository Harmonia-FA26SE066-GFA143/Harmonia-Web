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

const breadcrumb = [{ title: 'Cha xứ' }, { title: 'Chương trình phụng vụ' }, { title: 'Chi tiết chương trình' }]

/**
 * Priest: one program with its FE-16 information and current song list (FE-15, FE-20).
 * Not built (team decision 2026-09-26): "Công bố chương trình" and the publication/preparation status panel.
 */
export function PriestProgramDetailPage() {
  const navigate = useNavigate()
  const { programId = '' } = useParams()
  const program = useProgram(programId)
  const backButton = (
    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(paths.priest.programs)}>
      Về danh sách
    </Button>
  )

  if (program.isPending) return <PageSkeleton sections={2} />
  if (program.isError || !program.data) {
    return (
      <>
        <PageHeader title="Chi tiết chương trình phụng vụ" breadcrumb={breadcrumb} extra={backButton} />
        {program.isError ? (
          <ErrorState
            title="Không thể tải chương trình"
            onRetry={() => program.refetch()}
            retrying={program.isFetching}
          />
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
  const openReview = () => navigate(generatePath(paths.priest.songListReview, { programId: data.id }))

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
            data.songListStatus && (
              <Button type="primary" onClick={openReview}>
                Xem danh sách bài hát
              </Button>
            )
          }
          styles={{ body: { padding: data.songs.length > 0 ? 0 : spacing.lg } }}
        >
          {data.songs.length > 0 ? (
            <ProgramSongTable songs={data.songs} />
          ) : (
            <Typography.Text style={{ color: colors.textMuted }}>
              Chưa có danh sách bài hát. Ca trưởng sẽ đề xuất danh sách bài hát cho chương trình này.
            </Typography.Text>
          )}
        </Card>
      </Flex>
    </>
  )
}
