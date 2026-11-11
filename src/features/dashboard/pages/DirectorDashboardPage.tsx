import { ArrowRightOutlined } from '@ant-design/icons'
import { Button, Card, Flex, Typography } from 'antd'
import dayjs from 'dayjs'
import type { ReactNode } from 'react'
import { generatePath, Link, useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { formatProgramDate, useUpcomingPrograms, type LiturgicalProgram } from '@/features/liturgical-programs'
import { useSubmissions } from '@/features/practice'
import { usePendingSkills } from '@/features/skill-approval'
import { useSongList } from '@/features/song-lists'
import { parseUtc, vietnamToday } from '@/lib/api/dates'
import { AllDone, ErrorState, PageHeader, SectionSkeleton } from '@/shared/ui'
import { cardSurface, colors, spacing, typography } from '@/styles/tokens'
import { ProgramOrdo } from '../components/ProgramOrdo'
import { TodaySeason } from '../components/TodaySeason'

const taskLimit = 5
const programLimit = 5
const firstFive = { pageNumber: 1, pageSize: 5 }

const muted = { color: colors.textMuted, fontSize: typography.metadata.fontSize }
const rowStyle = (index: number) => ({
  padding: `${spacing.md}px ${spacing.lg}px`,
  borderTop: index > 0 ? `1px solid ${colors.border}` : undefined,
})
const detailPath = (program: LiturgicalProgram) => generatePath(paths.director.programDetail, { programId: program.id })

/** The Priest's note on the newest list, read only for the lists sent back. */
function PriestNote({ programId }: Readonly<{ programId: string }>) {
  const list = useSongList(programId)
  const notes = list.data?.reviews.at(-1)?.notes
  if (list.isPending) return <Typography.Text style={muted}>Đang tải nhận xét của Cha xứ…</Typography.Text>
  if (!notes) return <Typography.Text style={muted}>Cha xứ không để lại nhận xét.</Typography.Text>
  return <Typography.Text style={{ fontSize: 13 }}>Cha xứ: “{notes}”</Typography.Text>
}

interface Task {
  key: string
  /** Starts with the verb. */
  text: ReactNode
  /** The celebration date the task serves. */
  when?: string
  /** When the song list should be sent (`songListDueDate`, B44); a reminder, sending later is accepted. */
  due?: { date: string; overdue: boolean }
  detail?: ReactNode
  action: ReactNode
}

/** The song-list task of one upcoming program, if its list waits on the Choir Director. */
function songListTask(program: LiturgicalProgram, open: () => void): Task | undefined {
  const status = program.songListStatus
  const wording = !status
    ? { verb: 'Soạn danh sách bài hát', button: 'Soạn danh sách', aria: 'Đề xuất' }
    : status === 'draft'
      ? { verb: 'Gửi duyệt danh sách bài hát', button: 'Mở bản nháp', aria: 'Cập nhật' }
      : status === 'needsRevision'
        ? { verb: 'Sửa danh sách bài hát', button: 'Sửa danh sách', aria: 'Cập nhật' }
        : status === 'rejected'
          ? { verb: 'Soạn lại danh sách bài hát', button: 'Soạn lại', aria: 'Cập nhật' }
          : undefined
  if (!wording) return undefined
  const sentBack = status === 'needsRevision' || status === 'rejected'
  return {
    key: program.id,
    text: (
      <>
        {wording.verb} cho{' '}
        <Link to={detailPath(program)} style={{ fontWeight: 600 }}>
          {program.eventName}
        </Link>
      </>
    ),
    when: formatProgramDate(program.date),
    due: program.songListDueDate
      ? { date: formatProgramDate(program.songListDueDate), overdue: program.songListDueDate < vietnamToday() }
      : undefined,
    detail: sentBack ? (
      <PriestNote programId={program.id} />
    ) : (
      program.specialRequirements && <Typography.Text style={{ fontSize: 13 }}>Yêu cầu: {program.specialRequirements}</Typography.Text>
    ),
    action: (
      <Button type={sentBack ? 'primary' : 'default'} aria-label={`${wording.aria} danh sách bài hát: ${program.eventName}`} onClick={open}>
        {wording.button}
      </Button>
    ),
  }
}

function TaskList({ tasks, overflow }: Readonly<{ tasks: Task[]; overflow: number }>) {
  return (
    <Card style={cardSurface} styles={{ body: { padding: 0 } }}>
      <ul className="hm-stagger" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {tasks.map((task, index) => (
          <li key={task.key} style={rowStyle(index)}>
            <Flex vertical align="flex-start" gap={spacing.sm}>
              <Flex vertical gap={spacing.xs} style={{ minWidth: 0 }}>
                <Typography.Text>{task.text}</Typography.Text>
                {(task.due || task.when) && (
                  <Typography.Text style={muted}>
                    {task.due && (
                      <Typography.Text strong={task.due.overdue} style={{ color: task.due.overdue ? colors.primary : 'inherit' }}>
                        {task.due.overdue ? 'Quá hạn gửi' : 'Hạn gửi'} {task.due.date}
                      </Typography.Text>
                    )}
                    {task.due && task.when && ' · '}
                    {task.when && `Lễ cử hành ${task.when}`}
                  </Typography.Text>
                )}
                {task.detail}
              </Flex>
              <div style={{ flexShrink: 0 }}>{task.action}</div>
            </Flex>
          </li>
        ))}
        {overflow > 0 && (
          <li style={rowStyle(tasks.length)}>
            <Link to={paths.director.programs} style={{ fontWeight: 500 }}>
              và {overflow} việc khác <ArrowRightOutlined aria-hidden />
            </Link>
          </li>
        )}
      </ul>
    </Card>
  )
}

/** The oldest recordings waiting for a grade, graded on the practice page. */
function PendingSubmissions({ submissions }: Readonly<{ submissions: ReturnType<typeof useSubmissions> }>) {
  if (submissions.isPending) return <SectionSkeleton rows={3} label="Đang tải bài tập chờ chấm" />
  if (submissions.isError) {
    return <ErrorState headingLevel={3} title="Không thể tải bài tập chờ chấm" error={submissions.error} hasData={false} onRetry={() => submissions.refetch()} retrying={submissions.isFetching} />
  }
  const items = submissions.data.items
  return (
    <Card style={cardSurface} styles={{ body: { padding: items.length > 0 ? 0 : spacing.lg } }}>
      {items.length === 0 ? (
        <Typography.Text style={{ color: colors.textMuted }}>Không có bản thu nào chờ chấm.</Typography.Text>
      ) : (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {items.map((item, index) => (
            <li key={item.id} style={rowStyle(index)}>
              <Flex align="center" justify="space-between" gap={spacing.md}>
                <Flex vertical style={{ minWidth: 0 }}>
                  <Typography.Text style={{ fontWeight: 600 }}>{item.memberName}</Typography.Text>
                  <Typography.Text style={muted}>
                    {item.assignmentTitle} · lần {item.attemptNo} · nộp {dayjs(parseUtc(item.submittedAt)).format('HH:mm DD/MM')}
                  </Typography.Text>
                </Flex>
                <Link to={paths.director.practice} aria-label={`Chấm bản thu của ${item.memberName}`} style={{ fontWeight: 500 }}>
                  Chấm bài
                </Link>
              </Flex>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function Section({ id, title, extra, children }: Readonly<{ id: string; title: string; extra?: ReactNode; children: ReactNode }>) {
  return (
    <section aria-labelledby={id}>
      <Flex wrap align="baseline" justify="space-between" gap={spacing.sm} style={{ marginBottom: spacing.md }}>
        <Typography.Title id={id} level={2} style={{ margin: 0 }}>
          {title}
        </Typography.Title>
        {extra}
      </Flex>
      {children}
    </section>
  )
}

/**
 * Choir Director dashboard (Pattern 4, Dashboard / Overview): the upcoming programs as a ruled list with the nearest
 * open on what it still lacks, beside a column with the season of today, what waits on the Director (at most five
 * tasks, each starting with its verb, with its deadline and its button; more fold into "và N việc khác") and the
 * recordings waiting for a grade. Each part loads and fails on its own; every action leads to the page where it is done.
 */
export function DirectorDashboardPage() {
  const navigate = useNavigate()
  const programs = useUpcomingPrograms()
  const skills = usePendingSkills({ pageNumber: 1, pageSize: 1 })
  const submissions = useSubmissions('submitted', firstFive)

  const upcoming = programs.data ?? []
  const songListTasks: Task[] = upcoming.flatMap((program) => {
    const task = songListTask(program, () => navigate(generatePath(paths.director.songListProposal, { programId: program.id })))
    return task ? [task] : []
  })
  const tasks: Task[] = []
  const skillCount = skills.data?.totalCount ?? 0
  const submissionCount = submissions.data?.totalCount ?? 0
  if (skills.isError || skillCount > 0) {
    tasks.push({
      key: 'skills',
      text: skills.isError ? <Typography.Text type="danger">Không thể tải số kỹ năng chờ duyệt.</Typography.Text> : `Duyệt ${skillCount} kỹ năng ca viên đã khai`,
      action: <Link to={paths.director.skillApproval} style={{ fontWeight: 500 }}>Duyệt kỹ năng</Link>,
    })
  }
  if (submissions.isError || submissionCount > 0) {
    tasks.push({
      key: 'submissions',
      text: submissions.isError ? <Typography.Text type="danger">Không thể tải số bản thu chờ chấm.</Typography.Text> : `Chấm ${submissionCount} bản thu bài tập`,
      action: <Link to={paths.director.practice} style={{ fontWeight: 500 }}>Chấm bài</Link>,
    })
  }
  // Skills and recordings first: what folds into "và N việc khác" is then song lists, which that link leads to.
  tasks.push(...songListTasks)
  const countsLoaded = !skills.isPending && !submissions.isPending

  return (
    <div className="director-dashboard-page">
      <PageHeader title="Tổng quan" breadcrumb={[{ title: 'Ca trưởng' }, { title: 'Tổng quan' }]} />
      <div className="director-dashboard-grid">
        <Section
          id="next-heading"
          title="Các lễ sắp tới"
          extra={
            <Link to={paths.director.programs} style={{ fontWeight: 500 }}>
              Xem tất cả <ArrowRightOutlined aria-hidden />
            </Link>
          }
        >
          {programs.isPending && <SectionSkeleton rows={5} label="Đang tải các lễ sắp tới" />}
          {programs.isError && (
            <ErrorState headingLevel={3} title="Không thể tải chương trình sắp tới" error={programs.error} hasData={programs.data !== undefined} onRetry={() => programs.refetch()} retrying={programs.isFetching} />
          )}
          {programs.data !== undefined && upcoming.length === 0 && (
            <Card style={cardSurface}>
              <Typography.Text style={{ color: colors.textMuted }}>Chưa có chương trình sắp tới. Chương trình Cha xứ công bố sẽ xuất hiện tại đây.</Typography.Text>
            </Card>
          )}
          {upcoming.length > 0 && <ProgramOrdo programs={upcoming.slice(0, programLimit)} />}
        </Section>

        <Flex vertical gap={spacing.lg} style={{ minWidth: 0 }}>
          <TodaySeason />

          <Section id="todo-heading" title="Cần bạn xử lý">
            {programs.isPending && <SectionSkeleton rows={3} label="Đang tải việc cần xử lý" />}
            {programs.data !== undefined && countsLoaded && tasks.length === 0 && (
              <Card style={cardSurface}>
                <Flex vertical align="center" gap={spacing.sm} role="status">
                  <AllDone width={140} />
                  <Typography.Text>Mọi việc đã xong. Không có việc nào đang chờ bạn.</Typography.Text>
                </Flex>
              </Card>
            )}
            {programs.data !== undefined && tasks.length > 0 && <TaskList tasks={tasks.slice(0, taskLimit)} overflow={Math.max(0, tasks.length - taskLimit)} />}
          </Section>

          <Section id="practice-heading" title="Bài tập chờ chấm" extra={submissionCount > 5 && <Typography.Text style={{ color: colors.textMuted }}>5 trong {submissionCount} bản thu</Typography.Text>}>
            <PendingSubmissions submissions={submissions} />
          </Section>
        </Flex>
      </div>
    </div>
  )
}
