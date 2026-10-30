import { ArrowRightOutlined } from '@ant-design/icons'
import { Button, Card, Col, Flex, Row, Typography } from 'antd'
import { generatePath, useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import dayjs from 'dayjs'
import {
  formatProgramDate,
  ProgramTable,
  songListStatusLabels,
  useDirectorPreparation,
  useUpcomingPrograms,
  type LiturgicalProgram,
} from '@/features/liturgical-programs'
import { useSubmissions } from '@/features/practice'
import { usePendingSkills } from '@/features/skill-approval'
import { useSongList } from '@/features/song-lists'
import { EmptyState, ErrorState, MetricSummary, PageHeader, SectionSkeleton, StatusTag, type StatusTagColor } from '@/shared/ui'
import { cardSurface, colors, radius, sections, spacing, typography, type SectionColors } from '@/styles/tokens'

const upcomingLimit = 5
const todoLimit = 4
const countOnly = { pageNumber: 1, pageSize: 1 }

const metrics = [
  { key: 'upcoming', label: 'Chương trình sắp tới' },
  { key: 'skills', label: 'Kỹ năng chờ duyệt', to: paths.director.skillApproval, attention: true },
  { key: 'submissions', label: 'Bản thu chờ chấm', to: paths.director.practice, attention: true },
]

type Todo = 'none' | 'draft' | 'needsRevision' | 'rejected'

const todoOf = ({ songListStatus }: LiturgicalProgram): Todo | undefined => {
  if (!songListStatus) return 'none'
  return songListStatus === 'draft' || songListStatus === 'needsRevision' || songListStatus === 'rejected' ? songListStatus : undefined
}

const todoTags: Record<Todo, { label: string; color: StatusTagColor }> = {
  none: { label: 'Chưa đề xuất bài hát', color: 'blue' },
  draft: { label: 'Bản nháp chưa gửi duyệt', color: 'default' },
  needsRevision: { label: 'Cần chỉnh sửa danh sách bài hát', color: 'orange' },
  rejected: { label: 'Danh sách bị từ chối', color: 'red' },
}

const muted = { color: colors.textMuted, fontSize: typography.metadata.fontSize }

/** The Priest's note on the newest list, read only for the lists sent back. */
function PriestNote({ programId }: Readonly<{ programId: string }>) {
  const list = useSongList(programId)
  const notes = list.data?.reviews.at(-1)?.notes
  if (list.isPending) return <Typography.Text style={muted}>Đang tải nhận xét của Cha xứ…</Typography.Text>
  if (!notes) return <Typography.Text style={muted}>Cha xứ không để lại nhận xét.</Typography.Text>
  return <Typography.Text>“{notes}”</Typography.Text>
}

/** One upcoming program whose song list waits on the Choir Director. */
function TodoCard({ program, todo }: Readonly<{ program: LiturgicalProgram; todo: Todo }>) {
  const navigate = useNavigate()
  const sentBack = todo === 'needsRevision' || todo === 'rejected'
  const { label, color } = todoTags[todo]
  // An untitled program is already named after its Mass or ceremony type.
  const type = program.massTypeName ?? program.ceremonyTypeName
  const kind = [type !== program.eventName && type, program.time].filter(Boolean).join(' · ')

  return (
    <Card
      style={{ ...cardSurface, height: '100%' }}
      styles={{ body: { padding: spacing.lg, height: '100%' } }}
    >
      <Flex vertical gap={spacing.sm} style={{ height: '100%' }}>
        <Flex wrap align="center" justify="space-between" gap={spacing.sm}>
          <StatusTag color={color} style={{ marginInlineEnd: 0 }}>
            {label}
          </StatusTag>
          <Typography.Text style={{ ...muted, fontVariantNumeric: 'tabular-nums' }}>{formatProgramDate(program.date)}</Typography.Text>
        </Flex>
        <div>
          <Typography.Title level={3} style={{ margin: 0, fontSize: 16.5, fontWeight: 700 }}>
            {program.eventName}
          </Typography.Title>
          {kind && <Typography.Text style={muted}>{kind}</Typography.Text>}
        </div>
        <div
          style={{
            background: sentBack ? 'rgba(207, 19, 34, 0.04)' : colors.softSurface,
            border: `1px solid ${sentBack ? 'rgba(207, 19, 34, 0.12)' : colors.border}`,
            borderRadius: radius.md,
            padding: spacing.md,
            flex: 1,
          }}
        >
          <Typography.Text strong style={{ display: 'block', marginBottom: spacing.xs, fontSize: 13 }}>
            {sentBack ? 'Nhận xét của Cha xứ' : 'Yêu cầu đặc biệt'}
          </Typography.Text>
          {sentBack ? (
            <PriestNote programId={program.id} />
          ) : (
            <Typography.Text style={{ fontSize: 13.5 }}>{program.specialRequirements ?? 'Không có yêu cầu đặc biệt.'}</Typography.Text>
          )}
        </div>
        <Flex wrap justify="space-between" align="center" gap={spacing.sm} style={{ marginTop: 'auto' }}>
          <Button
            type="link"
            style={{ paddingInline: 0, fontSize: 13 }}
            onClick={() => navigate(generatePath(paths.director.programDetail, { programId: program.id }))}
          >
            Chi tiết chương trình
          </Button>
          <Button
            type={sentBack ? 'primary' : 'default'}
            style={{ fontWeight: 500 }}
            aria-label={`${sentBack || todo === 'draft' ? 'Cập nhật' : 'Đề xuất'} danh sách bài hát: ${program.eventName}`}
            onClick={() => navigate(generatePath(paths.director.songListProposal, { programId: program.id }))}
          >
            {sentBack || todo === 'draft' ? 'Cập nhật danh sách bài hát' : 'Soạn & đề xuất bài hát'}
          </Button>
        </Flex>
      </Flex>
    </Card>
  )
}

/** Readiness on the fixed four-step ramp used across the web; the text beside it states the value. */
function Ramp({ filled, cloth }: Readonly<{ filled: number; cloth: SectionColors }>) {
  return (
    <Flex aria-hidden gap={3}>
      {[0, 1, 2, 3].map((step) => (
        <span
          key={step}
          style={{ flex: 1, height: 8, borderRadius: 2, border: `1px solid ${cloth.cloth}`, background: step < filled ? cloth.cloth : cloth.tint }}
        />
      ))}
    </Flex>
  )
}

const quarters = (done: number, total: number) => (total > 0 ? Math.round((Math.min(done, total) / total) * 4) : 0)
const songListFill = { draft: 1, rejected: 1, needsRevision: 1, submitted: 3, approved: 4 } as const

/**
 * The next published program and how far each part of its preparation has come: song list, rehearsals, roster and
 * practice, each in its area's colour. Counts come from what the Choir Director may read
 * (useDirectorPreparation, #246). A part that waits on the Director turns amber.
 */
function NextProgram({ program }: Readonly<{ program: LiturgicalProgram }>) {
  const navigate = useNavigate()
  const prep = useDirectorPreparation(program.id)
  const date = dayjs(program.date)
  const weekday = date.format('dddd')
  const place = [`${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${formatProgramDate(program.date)}`, program.time, program.locationName, program.seasonName]
    .filter(Boolean)
    .join(' · ')

  const data = prep.data
  const songList = program.songListStatus
  const shortages = data?.rosterShortages?.length ?? 0
  const steps = [
    {
      label: 'Danh sách bài hát',
      cloth: sections.liturgy,
      value: songList ? songListStatusLabels[songList] : 'Chưa đề xuất',
      filled: songList ? songListFill[songList] : 0,
      waiting: !songList || songList === 'draft' || songList === 'needsRevision' || songList === 'rejected',
    },
    {
      label: 'Buổi tập',
      cloth: sections.rehearsal,
      value: data && (data.rehearsalsTotal > 0 ? `${data.rehearsalsHeld}/${data.rehearsalsTotal} buổi đã tập` : 'Chưa có buổi tập'),
      filled: data ? quarters(data.rehearsalsHeld, data.rehearsalsTotal) : 0,
      waiting: data?.rehearsalsTotal === 0,
    },
    {
      label: 'Phân công',
      cloth: shortages > 0 ? sections.attention : sections.roster,
      value: data && (data.rosterFinalized === undefined ? 'Chưa lập' : shortages > 0 ? `Thiếu ${shortages} vị trí` : data.rosterFinalized ? 'Đã chốt' : 'Đang soạn'),
      filled: data ? (data.rosterFinalized === undefined ? 0 : shortages > 0 ? 2 : data.rosterFinalized ? 4 : 3) : 0,
      waiting: shortages > 0,
    },
    {
      label: 'Luyện tập',
      cloth: sections.practice,
      value: data && (data.practiceExpected > 0 ? `${data.practicePassed}/${data.practiceExpected} lượt đạt` : 'Chưa giao bài'),
      filled: data ? quarters(data.practicePassed, data.practiceExpected) : 0,
      waiting: (data?.practiceOverdue ?? 0) > 0,
    },
  ]

  return (
    <Card style={cardSurface} styles={{ body: { padding: spacing.lg } }}>
      <Flex wrap align="flex-start" justify="space-between" gap={spacing.md} style={{ marginBottom: spacing.lg }}>
        <div style={{ minWidth: 0 }}>
          <Typography.Title level={3} style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
            {program.eventName}
          </Typography.Title>
          <Typography.Text style={{ color: colors.textMuted, fontVariantNumeric: 'tabular-nums' }}>{place}</Typography.Text>
        </div>
        <Button onClick={() => navigate(generatePath(paths.director.programDetail, { programId: program.id }))}>
          Xem tình hình chuẩn bị
        </Button>
      </Flex>
      {prep.isError ? (
        <Flex align="center" gap={spacing.sm} wrap>
          <Typography.Text type="danger">Không thể tải tình hình chuẩn bị.</Typography.Text>
          <Button size="small" onClick={() => prep.refetch()} loading={prep.isFetching}>
            Thử lại
          </Button>
        </Flex>
      ) : (
        // What is still missing is the biggest thing on the screen: one column per part of the preparation.
        <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: spacing.lg, margin: 0 }}>
          {steps.map((step) => (
            <div key={step.label}>
              <dt style={{ fontSize: 13, fontWeight: 500, color: colors.textMuted }}>{step.label}</dt>
              <dd
                style={{
                  margin: '4px 0 10px',
                  fontSize: 20,
                  fontWeight: 600,
                  lineHeight: 1.3,
                  fontVariantNumeric: 'tabular-nums',
                  color: step.waiting ? sections.attention.ink : colors.textPrimary,
                }}
              >
                {step.value ?? <span style={{ color: colors.textMuted, fontWeight: 400, fontSize: 14 }}>Đang tải…</span>}
              </dd>
              <dd style={{ margin: 0 }}>
                <Ramp filled={step.filled} cloth={step.cloth} />
              </dd>
            </div>
          ))}
        </dl>
      )}
    </Card>
  )
}

/** The line under the title: what to do next, read from the upcoming programs once they load. */
function nextStep(upcoming: LiturgicalProgram[] | undefined, todoCount: number) {
  if (upcoming === undefined) return 'Việc chuẩn bị của ca đoàn cho các chương trình sắp tới.'
  if (todoCount > 0) return `${todoCount} chương trình sắp tới cần chuẩn bị danh sách bài hát.`
  const next = upcoming[0]
  if (!next) return 'Chưa có chương trình sắp tới.'
  return `Không có danh sách bài hát cần chuẩn bị. Chương trình gần nhất: ${next.eventName}, ${formatProgramDate(next.date)}.`
}

/**
 * Choir Director dashboard: the next step under the title, counts, the upcoming programs whose song list waits on the
 * Director (none yet, a draft, rejected or sent back for revision) and the next programs. Each section loads and fails
 * on its own. No banner and no shortcut cards: the sidebar already lists every area (#244). The Stitch "Chuẩn bị" column is not shown: the Choir Director reads readiness per member
 * (practice "Tiến độ"), not per program.
 */
export function DirectorDashboardPage() {
  const navigate = useNavigate()
  const programs = useUpcomingPrograms()
  const skills = usePendingSkills(countOnly)
  const submissions = useSubmissions('submitted', countOnly)

  const upcoming = programs.data ?? []
  const todos = upcoming.flatMap((program) => {
    const todo = todoOf(program)
    return todo ? [{ program, todo }] : []
  })

  return (
    <div className="director-dashboard-page">
      <PageHeader
        title="Tổng quan"
        breadcrumb={[{ title: 'Ca trưởng' }, { title: 'Tổng quan' }]}
        description={nextStep(programs.data, todos.length)}
        extra={
          <Button icon={<ArrowRightOutlined />} iconPlacement="end" onClick={() => navigate(paths.director.programs)}>
            Mở chương trình phụng vụ
          </Button>
        }
      />
      <Flex vertical gap={spacing.lg}>
        {upcoming[0] && (
          <section aria-labelledby="next-heading">
            <Typography.Title id="next-heading" level={2} style={{ marginBottom: spacing.md }}>
              Chương trình kế tiếp
            </Typography.Title>
            <NextProgram program={upcoming[0]} />
          </section>
        )}
        <MetricSummary
          definitions={metrics}
          values={{ upcoming: programs.data?.length, skills: skills.data?.totalCount, submissions: submissions.data?.totalCount }}
        />

        <section aria-labelledby="todo-heading">
          <Flex wrap align="baseline" justify="space-between" gap={spacing.sm} style={{ marginBottom: spacing.md }}>
            <Typography.Title id="todo-heading" level={2} style={{ margin: 0 }}>
              Cần xử lý
            </Typography.Title>
            {programs.data !== undefined && todos.length > 0 && (
              <Typography.Text style={{ color: colors.textMuted }}>{todos.length} chương trình cần chuẩn bị bài hát</Typography.Text>
            )}
          </Flex>
          {programs.isPending && <SectionSkeleton rows={3} label="Đang tải việc cần xử lý" />}
          {programs.isError && (
            <ErrorState headingLevel={3} title="Không thể tải chương trình sắp tới" error={programs.error} hasData={programs.data !== undefined} onRetry={() => programs.refetch()} retrying={programs.isFetching} />
          )}
          {programs.data !== undefined && todos.length === 0 && (
            <EmptyState
              headingLevel={3}
              title="Không có danh sách bài hát cần chuẩn bị"
              description="Các chương trình sắp tới đều đã gửi danh sách bài hát để duyệt hoặc đã được phê duyệt."
            />
          )}
          {programs.data !== undefined && todos.length > 0 && (
            <Row gutter={[spacing.md, spacing.md]}>
              {todos.slice(0, todoLimit).map(({ program, todo }) => (
                <Col key={program.id} xs={24} lg={12}>
                  <TodoCard program={program} todo={todo} />
                </Col>
              ))}
            </Row>
          )}
          {todos.length > todoLimit && (
            <Button type="link" style={{ paddingInline: 0, marginTop: spacing.sm }} onClick={() => navigate(paths.director.programs)}>
              Còn {todos.length - todoLimit} chương trình khác cần chuẩn bị
            </Button>
          )}
        </section>

        <section aria-labelledby="upcoming-heading">
          <Flex wrap align="center" justify="space-between" gap={spacing.sm} style={{ marginBottom: spacing.md }}>
            <Typography.Title id="upcoming-heading" level={2} style={{ margin: 0 }}>
              Chương trình sắp tới
            </Typography.Title>
            <Button onClick={() => navigate(paths.director.programs)}>Xem tất cả chương trình</Button>
          </Flex>
          {programs.isPending && <SectionSkeleton rows={upcomingLimit} label="Đang tải chương trình sắp tới" />}
          {programs.isError && (
            <ErrorState headingLevel={3} title="Không thể tải chương trình sắp tới" error={programs.error} hasData={programs.data !== undefined} onRetry={() => programs.refetch()} retrying={programs.isFetching} />
          )}
          {programs.data !== undefined && upcoming.length === 0 && (
            <EmptyState headingLevel={3} title="Chưa có chương trình sắp tới" description="Chương trình Cha xứ công bố sẽ xuất hiện tại đây." />
          )}
          {programs.data !== undefined && upcoming.length > 0 && (
            <Card styles={{ body: { padding: 0 } }}>
              <ProgramTable
                programs={upcoming.slice(0, upcomingLimit)}
                onOpen={(program) => navigate(generatePath(paths.director.programDetail, { programId: program.id }))}
              />
            </Card>
          )}
        </section>
      </Flex>
    </div>
  )
}
