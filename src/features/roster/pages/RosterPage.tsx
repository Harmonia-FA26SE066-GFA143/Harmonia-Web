import { Alert, Button, Card, Flex, Select } from 'antd'
import { useMemo } from 'react'
import { generatePath, Link, useNavigate, useSearchParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { formatProgramDate, SongListStatusTag, upcomingPrograms, usePrograms } from '@/features/liturgical-programs'
import { useParticipation } from '@/features/participation'
import { useSongList } from '@/features/song-lists'
import { useSkillCategories } from '@/features/system-categories'
import { EmptyState, ErrorState, PageHeader, SectionSkeleton } from '@/shared/ui'
import { spacing } from '@/styles/tokens'
import { RosterEditor } from '../components/RosterEditor'
import { useRoster } from '../hooks/useRoster'

/**
 * Choir Director: staffing requirements and service roster of a program (FE-35–FE-38, FE-40), decisions of
 * 2026-10-01 in roster.md. INTERPRETATION – chờ xác nhận: requirements are set on the approved song list, so the
 * page waits for an approved list (FE-35 per song, FE-39 after approval, like rehearsals in 6a.2).
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
  const roster = useRoster(approved ? programId : undefined)
  const participation = useParticipation(approved ? programId : undefined)
  const skills = useSkillCategories()

  const loading = songList.isPending || (approved && (roster.isPending || participation.isPending || skills.isPending))
  const failed = [songList, roster, participation, skills].find((query) => query.isError)

  return (
    <>
      <PageHeader
        title="Yêu cầu nhân sự & Phân công"
        breadcrumb={[{ title: 'Ca trưởng' }, { title: 'Phân công phục vụ' }]}
        description="Thiết lập yêu cầu kỹ năng theo từng bài hát và cho cả chương trình, xem gợi ý, phát hiện thiếu người và điều chỉnh danh sách phục vụ."
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
              onRetry={() => [songList, roster, participation, skills].forEach((query) => query.isError && query.refetch())}
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
          {!failed && !loading && approved && roster.data && (
            <RosterEditor
              // Remount after a save or a program change so the draft starts from the saved roster.
              key={`${program.id}-${roster.dataUpdatedAt}`}
              roster={roster.data}
              songs={(songList.data?.items ?? []).map(({ songId, title, liturgicalPart }) => ({ songId, title, liturgicalPart }))}
              eligible={(participation.data ?? []).filter((request) => request.response === 'confirmed')}
              skills={(skills.data ?? []).map(({ id, name }) => ({ id, name }))}
            />
          )}
        </Flex>
      )}
    </>
  )
}
