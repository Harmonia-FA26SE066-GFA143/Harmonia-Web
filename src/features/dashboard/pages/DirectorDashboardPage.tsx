import { ArrowRightOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { Button, Card, Flex, Typography } from 'antd'
import dayjs from 'dayjs'
import type { ReactNode } from 'react'
import { generatePath, Link, useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import {
  formatProgramDate,
  PreparationSteps,
  preparationSteps,
  SongListStatusTag,
  useDirectorPreparation,
  useLiturgicalDays,
  useUpcomingPrograms,
  type LiturgicalProgram,
} from '@/features/liturgical-programs'
import { useSubmissions } from '@/features/practice'
import { usePendingSkills } from '@/features/skill-approval'
import { useSongList } from '@/features/song-lists'
import { parseUtc } from '@/lib/api/dates'
import { ErrorState, PageHeader, SeasonRibbon, SectionSkeleton } from '@/shared/ui'
import { cardSurface, colors, spacing, typography } from '@/styles/tokens'

const taskLimit = 5
const laterLimit = 4
const firstFive = { pageNumber: 1, pageSize: 5 }

const muted = { color: colors.textMuted, fontSize: typography.metadata.fontSize }
const rowStyle = (index: number) => ({
  padding: `${spacing.md}px ${spacing.lg}px`,
  borderTop: index > 0 ? `1px solid ${colors.border}` : undefined,
})
const capitalize = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`
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
  /** The celebration date the task serves. Not a deadline: the BE has none for song lists (TBD). */
  when?: string
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
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {tasks.map((task, index) => (
          <li key={task.key} style={rowStyle(index)}>
            <Flex align="center" justify="space-between" gap={spacing.md}>
              <Flex vertical gap={spacing.xs} style={{ minWidth: 0, maxWidth: '72ch' }}>
                <Typography.Text>{task.text}</Typography.Text>
                {task.when && <Typography.Text style={muted}>Lễ cử hành {task.when}</Typography.Text>}
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

/** The next program: date, name, place and season, how far its preparation has come (Bước n/6), and a link out. */
function NextProgram({ program, prep }: Readonly<{ program: LiturgicalProgram; prep: ReturnType<typeof useDirectorPreparation> }>) {
  const navigate = useNavigate()
  const date = dayjs(program.date)
  const steps = preparationSteps({ date: program.date, songListStatus: program.songListStatus, status: prep.data, failed: prep.isError, viewer: 'director' })
  const meta = [program.time, program.locationName, program.seasonName].filter(Boolean).join(' · ')

  return (
    <Card style={cardSurface} styles={{ body: { padding: 0 } }}>
      <Flex align="center" gap={spacing.lg} style={{ padding: spacing.lg }}>
        <Flex vertical align="center" style={{ minWidth: 72 }}>
          <Typography.Text style={muted}>{capitalize(date.format('dddd'))}</Typography.Text>
          <span style={{ fontSize: 44, fontWeight: 600, lineHeight: 1, letterSpacing: '-0.03em', color: colors.primary }}>{date.format('DD')}</span>
          <Typography.Text style={muted}>Tháng {date.format('M')}</Typography.Text>
        </Flex>
        <div style={{ minWidth: 0, flex: 1 }}>
          <Typography.Title level={3} style={{ margin: 0, fontFamily: typography.displayFontFamily, fontSize: 30, fontWeight: 600, lineHeight: 1.25 }}>
            {program.eventName}
          </Typography.Title>
          {meta && <Typography.Text style={{ color: colors.textMuted }}>{meta}</Typography.Text>}
        </div>
        <Button onClick={() => navigate(detailPath(program))} aria-label={`Xem chi tiết: ${program.eventName}`} style={{ flexShrink: 0 }}>
          Xem chi tiết
        </Button>
      </Flex>
      <div style={{ padding: spacing.lg, borderTop: `1px solid ${colors.border}` }}>
        <PreparationSteps steps={steps} />
        {prep.isError && (
          <Flex align="center" gap={spacing.sm} wrap style={{ marginTop: spacing.md }}>
            <Typography.Text type="danger">Không thể tải tình hình chuẩn bị.</Typography.Text>
            <Button size="small" onClick={() => prep.refetch()} loading={prep.isFetching}>
              Thử lại
            </Button>
          </Flex>
        )}
      </div>
    </Card>
  )
}

/** The next program's positions still short of people, as dashed "Thiếu N" boxes (brief §12.7: words and a dashed edge, no red). */
function Parts({ program, prep }: Readonly<{ program: LiturgicalProgram; prep: ReturnType<typeof useDirectorPreparation> }>) {
  if (prep.isPending) return <SectionSkeleton rows={2} label="Đang tải các vị trí phục vụ" />
  if (prep.isError) {
    return <ErrorState headingLevel={3} title="Không thể tải các vị trí phục vụ" error={prep.error} hasData={false} onRetry={() => prep.refetch()} retrying={prep.isFetching} />
  }
  const shortages = prep.data?.rosterShortages ?? []
  return (
    <Card style={cardSurface}>
      {shortages.length === 0 ? (
        <Typography.Text style={{ color: colors.textMuted }}>
          {program.songListStatus === 'approved'
            ? 'Đủ người cho mọi vị trí đã khai.'
            : 'Nhu cầu nhân sự được tính sau khi danh sách bài hát được duyệt.'}
        </Typography.Text>
      ) : (
        <Flex vertical gap={spacing.md}>
          <ul style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.sm, margin: 0, padding: 0, listStyle: 'none' }}>
            {shortages.map((shortage) => (
              <li
                key={`${shortage.skillName}-${shortage.songTitle ?? ''}`}
                style={{ padding: `${spacing.sm}px ${spacing.md}px`, border: `1px dashed ${colors.textMuted}`, borderRadius: 6, minWidth: 160 }}
              >
                <Typography.Text style={{ display: 'block', fontWeight: 600 }}>
                  Thiếu {shortage.requiredCount - shortage.assignedCount}
                </Typography.Text>
                <Typography.Text style={{ display: 'block' }}>{shortage.skillName}</Typography.Text>
                <Typography.Text style={muted}>
                  {shortage.songTitle ? `${shortage.songTitle} · ` : 'Cả buổi lễ · '}đã có {shortage.assignedCount}/{shortage.requiredCount}
                </Typography.Text>
              </li>
            ))}
          </ul>
          <Link to={`${paths.director.roster}?programId=${program.id}`} style={{ fontWeight: 500 }}>
            Mở phân công <ArrowRightOutlined aria-hidden />
          </Link>
        </Flex>
      )}
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

/** The programs after the next one, one line each. */
function LaterPrograms({ programs }: Readonly<{ programs: LiturgicalProgram[] }>) {
  return (
    <Card style={cardSurface} styles={{ body: { padding: 0 } }}>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {programs.map((program, index) => (
          <li key={program.id} style={rowStyle(index)}>
            <Flex align="center" gap={spacing.lg}>
              <Typography.Text style={{ width: 88, flexShrink: 0, color: colors.textMuted }}>{formatProgramDate(program.date)}</Typography.Text>
              <Flex vertical style={{ minWidth: 0, flex: 1 }}>
                <Link to={detailPath(program)} style={{ fontWeight: 600 }}>
                  {program.eventName}
                </Link>
                <Typography.Text style={muted}>{[program.time, program.seasonName].filter(Boolean).join(' · ')}</Typography.Text>
              </Flex>
              {/* No column header here, so the empty case names what is missing. */}
              {program.songListStatus ? (
                <SongListStatusTag status={program.songListStatus} />
              ) : (
                <Typography.Text style={muted}>Chưa có danh sách bài hát</Typography.Text>
              )}
            </Flex>
          </li>
        ))}
      </ul>
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

/** The sections that need the next program's preparation counts, so they are read once for both. */
function NextProgramSections({ program }: Readonly<{ program: LiturgicalProgram }>) {
  const prep = useDirectorPreparation(program.id)
  return (
    <>
      <Section id="next-heading" title="Lễ sắp tới">
        <NextProgram program={program} prep={prep} />
      </Section>
      <Section id="parts-heading" title="Các bè và vị trí">
        <Parts program={program} prep={prep} />
      </Section>
    </>
  )
}

/**
 * Choir Director dashboard (Pattern 4, Dashboard / Overview; brief §12.2): the season of today, then what waits on
 * the Director (at most five tasks, each starting with its verb, with its deadline and its button; more fold into
 * "và N việc khác"), the next program with its numbered steps, its parts still short of people, the recordings
 * waiting for a grade, and the programs after it. Each part loads and fails on its own; every action leads to the
 * page where it is done. The season banner carries the view's one ribbon.
 */
export function DirectorDashboardPage() {
  const navigate = useNavigate()
  const programs = useUpcomingPrograms()
  const skills = usePendingSkills({ pageNumber: 1, pageSize: 1 })
  const submissions = useSubmissions('submitted', firstFive)
  const today = dayjs().format('YYYY-MM-DD')
  const days = useLiturgicalDays(today, today)
  const day = days.data?.get(today)

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
      <Flex vertical gap={spacing.xl}>
        {day?.seasonName && <SeasonRibbon seasonKey={day.seasonKey} seasonName={day.seasonName} celebrationName={day.celebrationName} />}
        {days.isError && (
          <Flex align="center" gap={spacing.sm}>
            <Typography.Text type="danger">Không thể tải mùa phụng vụ hôm nay.</Typography.Text>
            <Button size="small" onClick={() => days.refetch()} loading={days.isFetching}>
              Thử lại
            </Button>
          </Flex>
        )}

        <Section id="todo-heading" title="Cần bạn xử lý">
          {programs.isPending && <SectionSkeleton rows={3} label="Đang tải việc cần xử lý" />}
          {programs.isError && (
            <ErrorState headingLevel={3} title="Không thể tải chương trình sắp tới" error={programs.error} hasData={programs.data !== undefined} onRetry={() => programs.refetch()} retrying={programs.isFetching} />
          )}
          {programs.data !== undefined && countsLoaded && tasks.length === 0 && (
            <Card style={cardSurface}>
              <Flex align="center" gap={spacing.sm} role="status">
                <CheckCircleOutlined aria-hidden style={{ color: colors.primary, fontSize: 18 }} />
                <Typography.Text>Mọi việc đã xong. Không có việc nào đang chờ bạn.</Typography.Text>
              </Flex>
            </Card>
          )}
          {programs.data !== undefined && tasks.length > 0 && <TaskList tasks={tasks.slice(0, taskLimit)} overflow={Math.max(0, tasks.length - taskLimit)} />}
        </Section>

        {programs.data !== undefined && upcoming.length === 0 && (
          <Section id="next-heading" title="Lễ sắp tới">
            <Card style={cardSurface}>
              <Typography.Text style={{ color: colors.textMuted }}>Chưa có chương trình sắp tới. Chương trình Cha xứ công bố sẽ xuất hiện tại đây.</Typography.Text>
            </Card>
          </Section>
        )}
        {upcoming[0] && <NextProgramSections program={upcoming[0]} />}

        <Section id="practice-heading" title="Bài tập chờ chấm" extra={submissionCount > 5 && <Typography.Text style={{ color: colors.textMuted }}>5 trong {submissionCount} bản thu</Typography.Text>}>
          <PendingSubmissions submissions={submissions} />
        </Section>

        {upcoming.length > 1 && (
          <Section
            id="later-heading"
            title="Các lễ tiếp theo"
            extra={
              <Link to={paths.director.programs} style={{ fontWeight: 500 }}>
                Xem tất cả <ArrowRightOutlined aria-hidden />
              </Link>
            }
          >
            <LaterPrograms programs={upcoming.slice(1, 1 + laterLimit)} />
          </Section>
        )}
      </Flex>
    </div>
  )
}
