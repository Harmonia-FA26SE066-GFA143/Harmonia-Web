import { Alert, Button, Card, Flex, Select } from 'antd'
import { useMemo } from 'react'
import { generatePath, Link, useNavigate, useSearchParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { formatProgramDate, SongListStatusTag, useUpcomingPrograms } from '@/features/liturgical-programs'
import { useChoirMembers } from '@/features/members'
import { useParticipation } from '@/features/participation'
import { useSongList } from '@/features/song-lists'
import { useLookup } from '@/features/system-categories'
import { EmptyState, ErrorState, PageHeader, SectionSkeleton } from '@/shared/ui'
import { colors, spacing, typography } from '@/styles/tokens'
import { RosterPanel } from '../components/RosterPanel'

/**
 * Choir Director: staffing requirements and service roster of a program (FE-35–FE-40), as Harmonia-BE builds them
 * (see types.ts). Whole-service roles are staffed at any time; song positions wait for the approved song list
 * (ROSTER_SONG_LIST_NOT_APPROVED), which the page explains in their place.
 * `?programId=` selects the program (link from the program detail); otherwise the next upcoming program.
 * The backend lists only the programs served by the director's choirs (LiturgicalEventService, choir scope).
 */
export function RosterPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const programs = useUpcomingPrograms()
  const allPrograms = useMemo(() => programs.data ?? [], [programs.data])
  const program =
    allPrograms.find((item) => item.id === searchParams.get('programId')) ?? allPrograms[0]
  const programId = program?.id ?? ''
  const songList = useSongList(programId, { enabled: Boolean(programId) })
  const approved = songList.data?.status === 'approved'
  // Whole-service roles are staffed before the song list is approved, so the answers are read for every program.
  const participation = useParticipation(programId || undefined)
  const skills = useLookup('skills')
  const members = useChoirMembers()
  // Members who answered Confirmed or Unsure can be assigned (ServiceRosterRepository); skills from their profiles.
  const eligible = useMemo(() => {
    const skillsOf = new Map((members.data ?? []).map((member) => [member.id, member.skills]))
    return (participation.data ?? [])
      .filter((request) => request.response === 'confirmed' || request.response === 'unsure')
      .map(({ memberId, fullName }) => ({ memberId, fullName, skills: skillsOf.get(memberId) ?? [] }))
  }, [participation.data, members.data])

  const loading = songList.isPending || participation.isPending || skills.isPending || members.isPending
  const failed = [songList, participation, skills, members].find((query) => query.isError)
  const lastNotes = songList.data?.reviews.at(-1)?.notes
  const revise = songList.data?.status === 'needsRevision' || songList.data?.status === 'rejected'

  return (
    <>
      <PageHeader
        title="Yêu cầu nhân sự & Phân công"
        breadcrumb={[{ title: 'Ca trưởng' }, { title: 'Phân công phục vụ' }]}
        description="Bè đồng ca không cần phân công, chỉ cần xác nhận tham gia."
      />
      {programs.isPending && <SectionSkeleton rows={6} label="Đang tải chương trình phụng vụ" />}
      {programs.isError && (
        <ErrorState title="Không thể tải chương trình phụng vụ" error={programs.error} hasData={programs.data !== undefined} onRetry={() => programs.refetch()} retrying={programs.isFetching} />
      )}
      {programs.data !== undefined && !program && <EmptyState title="Chưa có chương trình phụng vụ" />}
      {program && (
        <Flex vertical gap={spacing.md}>
          <Card>
            <Flex wrap gap={spacing.md} align="center" justify="space-between">
              <Flex vertical gap={4} style={{ flex: '1 1 280px', maxWidth: 420, minWidth: 0 }}>
              <label htmlFor="roster-program" style={{ fontSize: typography.metadata.fontSize, color: colors.textMuted }}>
                Chương trình phụng vụ
              </label>
              <Select
                id="roster-program"
                showSearch
                optionFilterProp="label"
                value={program.id}
                onChange={(id: string) => setSearchParams({ programId: id })}
                options={allPrograms.map((item) => ({ value: item.id, label: `${item.eventName} · ${formatProgramDate(item.date)}` }))}
              />
              </Flex>
              <Flex wrap gap={spacing.sm} align="center">
                <SongListStatusTag status={program.songListStatus} />
                <Link to={generatePath(paths.director.programDetail, { programId: program.id })}>Xem chi tiết chương trình</Link>
              </Flex>
            </Flex>
          </Card>
          {failed && (
            <ErrorState
              title="Không thể tải dữ liệu phân công"
              onRetry={() => [songList, participation, skills, members].forEach((query) => query.isError && query.refetch())}
            />
          )}
          {!failed && loading && <SectionSkeleton rows={8} label="Đang tải phân công" />}
          {!failed && !loading && participation.data?.length === 0 && (
            <Alert
              type="info"
              showIcon
              title="Chưa gửi yêu cầu xác nhận tham gia"
              description={
                <>
                  Chỉ phân công được ca viên trả lời Xác nhận hoặc Chưa chắc chắn.{' '}
                  <Link to={`${paths.director.participation}?programId=${program.id}`}>Gửi yêu cầu xác nhận</Link>
                </>
              }
            />
          )}
          {!failed && !loading && (
            <RosterPanel
              // A program change starts from that program's saved requirements.
              key={program.id}
              programId={program.id}
              approved={approved}
              songs={approved ? (songList.data?.items ?? []).map(({ id, songTitle, slotName }) => ({ id, title: songTitle, liturgicalPart: slotName })) : []}
              eligible={eligible}
              skills={(skills.data ?? []).map(({ id, name }) => ({ id, name }))}
              songListNotice={
                <EmptyState
                  title="Chưa có danh sách bài hát đã duyệt"
                  description={
                    songList.data?.status === 'needsRevision'
                      ? `Cha xứ yêu cầu chỉnh sửa danh sách bài hát${lastNotes ? `: “${lastNotes}”` : ''}. Vui lòng cập nhật và gửi duyệt lại trước khi phân công theo bài.`
                      : songList.data?.status === 'rejected'
                        ? `Danh sách bài hát đã bị từ chối${lastNotes ? `: “${lastNotes}”` : ''}. Vui lòng biên soạn lại danh sách trước khi phân công theo bài.`
                        : songList.data?.status === 'submitted'
                          ? 'Danh sách bài hát đang chờ Cha xứ phê duyệt. Phân công theo bài sẽ mở sau khi được duyệt.'
                          : 'Phân công theo bài được thực hiện sau khi danh sách bài hát được duyệt.'
                  }
                  action={
                    <Button
                      type={revise ? 'primary' : 'default'}
                      onClick={() => navigate(generatePath(paths.director.songListProposal, { programId: program.id }))}
                    >
                      {revise ? 'Cập nhật danh sách bài hát' : 'Mở danh sách bài hát'}
                    </Button>
                  }
                />
              }
            />
          )}
        </Flex>
      )}
    </>
  )
}
