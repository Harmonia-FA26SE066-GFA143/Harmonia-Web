import { Alert, Button, Card, Flex, Select } from 'antd'
import { useMemo } from 'react'
import { generatePath, Link, useNavigate, useSearchParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { formatProgramDate, SongListStatusTag, upcomingPrograms, usePrograms } from '@/features/liturgical-programs'
import { useParticipation } from '@/features/participation'
import { useSongList } from '@/features/song-lists'
import { useLookup } from '@/features/system-categories'
import { EmptyState, ErrorState, PageHeader, SectionSkeleton } from '@/shared/ui'
import { spacing } from '@/styles/tokens'
import { RosterPanel } from '../components/RosterPanel'

/**
 * Choir Director: staffing requirements and service roster of a program (FE-35–FE-40), as Harmonia-BE builds them
 * (see types.ts). The backend works on the approved song list only (ROSTER_SONG_LIST_NOT_APPROVED), so the page waits
 * for one.
 * `?programId=` selects the program (link from the program detail); otherwise the next upcoming program.
 * TBD: assigned-program filtering for the Director (C4) comes with the auth/assignment contract.
 */
export function RosterPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const programs = usePrograms()
  const allPrograms = useMemo(() => programs.data ?? [], [programs.data])
  const program =
    allPrograms.find((item) => item.id === searchParams.get('programId')) ?? upcomingPrograms(allPrograms)[0] ?? allPrograms[0]
  const programId = program?.id ?? ''
  const songList = useSongList(programId, { enabled: Boolean(programId) })
  const approved = songList.data?.status === 'approved'
  const participation = useParticipation(approved ? programId : undefined)
  const skills = useLookup('skills')

  const loading = songList.isPending || (approved && (participation.isPending || skills.isPending))
  const failed = [songList, participation, skills].find((query) => query.isError)

  return (
    <>
      <PageHeader
        title="Yêu cầu nhân sự & Phân công"
        breadcrumb={[{ title: 'Ca trưởng' }, { title: 'Phân công phục vụ' }]}
        description="Thiết lập yêu cầu kỹ năng theo từng bài hát, gợi ý và điều chỉnh phân công, chốt rồi gửi thông báo cho ca viên."
      />
      {programs.isPending && <SectionSkeleton rows={6} label="Đang tải chương trình phụng vụ" />}
      {programs.isError && (
        <ErrorState title="Không thể tải chương trình phụng vụ" onRetry={() => programs.refetch()} retrying={programs.isFetching} />
      )}
      {programs.isSuccess && !program && <EmptyState title="Chưa có chương trình phụng vụ" />}
      {program && (
        <Flex vertical gap={spacing.md}>
          <Card>
            <Flex wrap gap={spacing.md} align="center" justify="space-between">
              <Select
                showSearch
                optionFilterProp="label"
                aria-label="Chọn chương trình phụng vụ"
                value={program.id}
                onChange={(id: string) => setSearchParams({ programId: id })}
                options={allPrograms.map((item) => ({ value: item.id, label: `${item.eventName} · ${formatProgramDate(item.date)}` }))}
                style={{ flex: '1 1 280px', maxWidth: 420, minWidth: 0 }}
              />
              <Flex wrap gap={spacing.sm} align="center">
                <SongListStatusTag status={program.songListStatus} />
                <Link to={generatePath(paths.director.programDetail, { programId: program.id })}>Xem chi tiết chương trình</Link>
              </Flex>
            </Flex>
          </Card>
          {failed && (
            <ErrorState
              title="Không thể tải dữ liệu phân công"
              onRetry={() => [songList, participation, skills].forEach((query) => query.isError && query.refetch())}
            />
          )}
          {!failed && loading && <SectionSkeleton rows={8} label="Đang tải phân công" />}
          {!failed && songList.isSuccess && !approved && (
            <EmptyState
              title="Chưa có danh sách bài hát đã duyệt"
              description="Phân công được thực hiện sau khi danh sách bài hát được duyệt."
              action={
                <Button onClick={() => navigate(generatePath(paths.director.songListProposal, { programId: program.id }))}>
                  Mở danh sách bài hát
                </Button>
              }
            />
          )}
          {!failed && !loading && approved && participation.data?.length === 0 && (
            <Alert
              type="info"
              showIcon
              title="Chưa gửi yêu cầu xác nhận tham gia"
              description={
                <>
                  Chỉ phân công được ca viên đã xác nhận tham gia.{' '}
                  <Link to={`${paths.director.participation}?programId=${program.id}`}>Gửi yêu cầu xác nhận</Link>
                </>
              }
            />
          )}
          {!failed && !loading && approved && (
            <RosterPanel
              // A program change starts from that program's saved requirements.
              key={program.id}
              programId={program.id}
              songs={(songList.data?.items ?? []).map(({ id, title, liturgicalPart }) => ({ id, title, liturgicalPart }))}
              eligible={(participation.data ?? []).filter((request) => request.response === 'confirmed')}
              skills={(skills.data ?? []).map(({ id, name }) => ({ id, name }))}
            />
          )}
        </Flex>
      )}
    </>
  )
}
