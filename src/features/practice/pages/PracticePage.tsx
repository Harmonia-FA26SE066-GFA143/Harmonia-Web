import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { App, Button, Card, Flex, Input, Segmented, Select, Tooltip, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { generatePath, Link, useSearchParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { formatProgramDate, upcomingPrograms, usePrograms } from '@/features/liturgical-programs'
import { useParticipation } from '@/features/participation'
import { useSongList } from '@/features/song-lists'
import { EmptyState, ErrorState, MetricSummary, NoFilterResults, PageHeader, SectionSkeleton } from '@/shared/ui'
import { matchesSearch } from '@/shared/utils/search'
import { spacing } from '@/styles/tokens'
import { AssignmentFormModal } from '../components/AssignmentFormModal'
import { AssignmentTable } from '../components/AssignmentTable'
import { ReviewModal } from '../components/ReviewModal'
import { SubmissionTable } from '../components/SubmissionTable'
import { useCreateAssignment, usePracticeAssignments, usePracticeSubmissions, useReviewSubmission } from '../hooks/usePractice'
import { practiceStatusLabels, type PracticeStatus, type PracticeSubmission } from '../types'

type StatusFilter = 'all' | PracticeStatus | 'none'

const metrics = [
  { key: 'assignments', label: 'Bài tập đã giao' },
  { key: 'submitted', label: practiceStatusLabels.submitted },
  { key: 'passed', label: practiceStatusLabels.passed },
  { key: 'needsRevision', label: practiceStatusLabels.needsRevision },
  { key: 'overdue', label: practiceStatusLabels.overdue },
]

/**
 * Choir Director: practice assignments of a program and the members' progress (FE-12, FE-41–FE-46), decisions of
 * 2026-10-01 in practice-submission.md. `?programId=` selects the program; otherwise the next upcoming program.
 */
export function PracticePage() {
  const { message } = App.useApp()
  const [searchParams, setSearchParams] = useSearchParams()
  const programs = usePrograms()
  const allPrograms = useMemo(() => programs.data ?? [], [programs.data])
  const program =
    allPrograms.find((item) => item.id === searchParams.get('programId')) ?? upcomingPrograms(allPrograms)[0] ?? allPrograms[0]
  const programId = program?.id ?? ''
  const assignments = usePracticeAssignments(program?.id)
  const submissions = usePracticeSubmissions(program?.id)
  const songList = useSongList(programId, { enabled: Boolean(programId) })
  const participation = useParticipation(program?.id)
  const create = useCreateAssignment(programId)
  const review = useReviewSubmission(programId)
  const [creating, setCreating] = useState(false)
  const [reviewing, setReviewing] = useState<PracticeSubmission>()
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [assignmentId, setAssignmentId] = useState<string>()
  const [search, setSearch] = useState('')

  const assignmentMap = useMemo(() => new Map((assignments.data ?? []).map((item) => [item.id, item])), [assignments.data])
  const rows = useMemo(() => submissions.data ?? [], [submissions.data])
  const counts = useMemo(() => {
    const count = (status?: PracticeStatus) => rows.filter((row) => row.status === status).length
    return {
      assignments: assignments.data?.length,
      submitted: count('submitted'),
      passed: count('passed'),
      needsRevision: count('needsRevision'),
      overdue: count('overdue'),
      none: count(),
      all: rows.length,
    }
  }, [rows, assignments.data])
  const visible = rows.filter(
    (row) =>
      (filter === 'all' || (filter === 'none' ? !row.status : row.status === filter)) &&
      (!assignmentId || row.assignmentId === assignmentId) &&
      matchesSearch(search, row.fullName, ...row.skills),
  )

  const approvedSongs = songList.data?.status === 'approved' ? songList.data.items : []
  const confirmed = (participation.data ?? []).filter((request) => request.response === 'confirmed')
  // Business reasons are shown only once the data is known, so loading or errors are not mistaken for facts.
  const cannotAssign = (() => {
    if (songList.isError || participation.isError) return 'Không tải được dữ liệu chương trình.'
    if (!songList.isSuccess || !participation.isSuccess) return 'Đang tải dữ liệu chương trình…'
    if (approvedSongs.length === 0) return 'Cần danh sách bài hát đã được duyệt để giao bài tập.'
    if (confirmed.length === 0) return 'Chưa có ca viên xác nhận tham gia chương trình này.'
    return undefined
  })()

  const createButton = (
    <Tooltip title={cannotAssign}>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreating(true)} disabled={Boolean(cannotAssign)}>
        Giao bài tập
      </Button>
    </Tooltip>
  )

  const loading = assignments.isPending || submissions.isPending
  const failed = assignments.isError || submissions.isError

  return (
    <>
      <PageHeader
        title="Bài tập & Tiến độ luyện tập"
        breadcrumb={[{ title: 'Ca trưởng' }, { title: 'Luyện tập' }]}
        description="Giao bài tập luyện tập, theo dõi tiến độ nộp bản thu, nghe và đánh giá bài nộp của ca viên."
        extra={program && createButton}
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
                onChange={(id: string) => {
                  setAssignmentId(undefined)
                  setSearchParams({ programId: id })
                }}
                options={allPrograms.map((item) => ({ value: item.id, label: `${item.eventName} · ${formatProgramDate(item.date)}` }))}
                style={{ flex: '1 1 280px', maxWidth: 420, minWidth: 0 }}
              />
              <Link to={generatePath(paths.director.programDetail, { programId: program.id })}>Xem chi tiết chương trình</Link>
            </Flex>
          </Card>
          {failed && (
            <ErrorState
              title="Không thể tải bài tập luyện tập"
              onRetry={() => {
                if (assignments.isError) assignments.refetch()
                if (submissions.isError) submissions.refetch()
              }}
            />
          )}
          {!failed && loading && <SectionSkeleton rows={8} label="Đang tải bài tập" />}
          {!failed && !loading && assignments.data?.length === 0 && (
            <EmptyState
              title="Chưa giao bài tập nào"
              description={cannotAssign ?? 'Giao bài tập cho ca viên đã xác nhận tham gia để theo dõi tiến độ luyện tập.'}
              action={cannotAssign ? undefined : createButton}
            />
          )}
          {!failed && !loading && (assignments.data?.length ?? 0) > 0 && (
            <>
              <MetricSummary definitions={metrics} values={counts} />
              <Card title="Bài tập đã giao" styles={{ body: { padding: 0 } }}>
                <AssignmentTable assignments={assignments.data ?? []} submissions={rows} />
              </Card>
              <Card title="Bài nộp của ca viên" styles={{ body: { padding: 0 } }}>
                <Flex vertical gap={spacing.sm} style={{ padding: spacing.md }}>
                  <Flex wrap gap={spacing.sm}>
                    <Input
                      allowClear
                      prefix={<SearchOutlined aria-hidden />}
                      placeholder="Tìm theo tên hoặc kỹ năng"
                      aria-label="Tìm ca viên"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      style={{ flex: '1 1 220px', maxWidth: 320 }}
                    />
                    <Select
                      allowClear
                      aria-label="Lọc theo bài tập"
                      placeholder="Tất cả bài tập"
                      value={assignmentId}
                      onChange={setAssignmentId}
                      options={(assignments.data ?? []).map((item) => ({ value: item.id, label: item.title }))}
                      style={{ flex: '1 1 220px', maxWidth: 320, minWidth: 0 }}
                    />
                  </Flex>
                  <Segmented<StatusFilter>
                    value={filter}
                    onChange={setFilter}
                    style={{ alignSelf: 'flex-start', maxWidth: '100%', overflowX: 'auto' }}
                    options={[
                      { value: 'all', label: `Tất cả (${counts.all})` },
                      { value: 'submitted', label: `${practiceStatusLabels.submitted} (${counts.submitted})` },
                      { value: 'passed', label: `${practiceStatusLabels.passed} (${counts.passed})` },
                      { value: 'needsRevision', label: `${practiceStatusLabels.needsRevision} (${counts.needsRevision})` },
                      { value: 'overdue', label: `${practiceStatusLabels.overdue} (${counts.overdue})` },
                      { value: 'none', label: `Chưa nộp (${counts.none})` },
                    ]}
                  />
                </Flex>
                {visible.length === 0 ? (
                  <div style={{ padding: `0 ${spacing.md}px ${spacing.md}px` }}>
                    <NoFilterResults
                      onClearFilters={() => {
                        setFilter('all')
                        setAssignmentId(undefined)
                        setSearch('')
                      }}
                    />
                  </div>
                ) : (
                  <SubmissionTable submissions={visible} assignments={assignmentMap} onReview={setReviewing} />
                )}
              </Card>
            </>
          )}
          <Typography.Text type="secondary">
            Bài nộp được Ca trưởng nghe và đánh giá thủ công; hệ thống không tự chấm chất lượng.
          </Typography.Text>
        </Flex>
      )}
      <AssignmentFormModal
        open={creating}
        songs={approvedSongs}
        members={confirmed}
        saving={create.isPending}
        onSubmit={(values) =>
          create.mutate(values, {
            onSuccess: () => {
              message.success('Đã giao bài tập.')
              setCreating(false)
            },
            onError: () => message.error('Không thể giao bài tập. Vui lòng thử lại.'),
          })
        }
        onCancel={() => setCreating(false)}
      />
      <ReviewModal
        submission={reviewing}
        assignmentTitle={reviewing ? assignmentMap.get(reviewing.assignmentId)?.title : undefined}
        saving={review.isPending}
        onSubmit={(values) =>
          reviewing &&
          review.mutate(
            { submissionId: reviewing.id, ...values },
            {
              onSuccess: () => {
                message.success('Đã lưu đánh giá.')
                setReviewing(undefined)
              },
              onError: () => message.error('Không thể lưu đánh giá. Vui lòng thử lại.'),
            },
          )
        }
        onCancel={() => setReviewing(undefined)}
      />
    </>
  )
}
