import { CalendarOutlined, FileTextOutlined, ReadOutlined, TeamOutlined } from '@ant-design/icons'
import { Button, Card, Col, Flex, Row, Typography } from 'antd'
import type { ComponentType } from 'react'
import { generatePath, Link, useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { formatProgramDate, ProgramTable, useUpcomingPrograms, type LiturgicalProgram } from '@/features/liturgical-programs'
import { useSubmissions } from '@/features/practice'
import { usePendingSkills } from '@/features/skill-approval'
import { useSongList } from '@/features/song-lists'
import { EmptyState, ErrorState, MetricSummary, PageHeader, SectionSkeleton, StatusTag, type StatusTagColor } from '@/shared/ui'
import { colors, radius, spacing, typography } from '@/styles/tokens'

const upcomingLimit = 5
const todoLimit = 4
const countOnly = { pageNumber: 1, pageSize: 1 }

const metrics = [
  { key: 'upcoming', label: 'Chương trình sắp tới' },
  { key: 'skills', label: 'Kỹ năng chờ duyệt' },
  { key: 'submissions', label: 'Bản thu chờ chấm' },
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
    <Card style={{ height: '100%' }} styles={{ body: { padding: spacing.lg, height: '100%' } }}>
      <Flex vertical gap={spacing.sm} style={{ height: '100%' }}>
        <Flex wrap align="center" justify="space-between" gap={spacing.sm}>
          <StatusTag color={color} style={{ marginInlineEnd: 0 }}>
            {label}
          </StatusTag>
          <Typography.Text style={{ ...muted, fontFamily: typography.fontFamilyNumeric }}>{formatProgramDate(program.date)}</Typography.Text>
        </Flex>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {program.eventName}
          </Typography.Title>
          {kind && <Typography.Text style={muted}>{kind}</Typography.Text>}
        </div>
        <div style={{ background: colors.softSurface, borderRadius: radius.md, padding: spacing.md, flex: 1 }}>
          <Typography.Text strong style={{ display: 'block', marginBottom: spacing.xs }}>
            {sentBack ? 'Nhận xét của Cha xứ' : 'Yêu cầu đặc biệt'}
          </Typography.Text>
          {sentBack ? (
            <PriestNote programId={program.id} />
          ) : (
            <Typography.Text>{program.specialRequirements ?? 'Không có yêu cầu đặc biệt.'}</Typography.Text>
          )}
        </div>
        <Button
          type={sentBack ? 'primary' : 'default'}
          style={{ alignSelf: 'flex-end' }}
          aria-label={`${sentBack || todo === 'draft' ? 'Cập nhật' : 'Đề xuất'} danh sách bài hát: ${program.eventName}`}
          onClick={() => navigate(generatePath(paths.director.songListProposal, { programId: program.id }))}
        >
          {sentBack || todo === 'draft' ? 'Cập nhật danh sách bài hát' : 'Soạn & đề xuất bài hát'}
        </Button>
      </Flex>
    </Card>
  )
}

interface Shortcut {
  path: string
  title: string
  description: string
  icon: ComponentType
}

const shortcuts: Shortcut[] = [
  { path: paths.director.programs, title: 'Chương trình phụng vụ', description: 'Các chương trình Cha xứ đã công bố.', icon: FileTextOutlined },
  { path: paths.director.library, title: 'Kho bài hát', description: 'Tra cứu bài hát và tài liệu tập hát.', icon: ReadOutlined },
  { path: paths.director.rehearsals, title: 'Lịch tập', description: 'Lên lịch các buổi tập cho lễ sắp tới.', icon: CalendarOutlined },
  { path: paths.director.members, title: 'Ca viên & kỹ năng', description: 'Hồ sơ ca viên và kỹ năng đã duyệt.', icon: TeamOutlined },
]

/**
 * Choir Director dashboard (Stitch "Tổng quan Ca trưởng"): counts, the upcoming programs whose song list waits on the
 * Director (none yet, a draft, rejected or sent back for revision), the next programs and shortcuts. Each section
 * loads and fails on its own. The Stitch "Chuẩn bị" column is not shown: the Choir Director reads readiness per member
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
    <>
      <PageHeader
        title="Tổng quan"
        breadcrumb={[{ title: 'Ca trưởng' }, { title: 'Tổng quan' }]}
        description="Quản lý các chương trình và công việc chuẩn bị của ca đoàn."
      />
      <Flex vertical gap={spacing.xl}>
        <MetricSummary
          definitions={metrics}
          values={{ upcoming: programs.data?.length, skills: skills.data?.totalCount, submissions: submissions.data?.totalCount }}
        />

        <section aria-labelledby="todo-heading">
          <Flex wrap align="baseline" justify="space-between" gap={spacing.sm} style={{ marginBottom: spacing.md }}>
            <Typography.Title id="todo-heading" level={2} style={{ margin: 0 }}>
              Cần xử lý
            </Typography.Title>
            {programs.isSuccess && todos.length > 0 && (
              <Typography.Text style={{ color: colors.textMuted }}>{todos.length} chương trình cần chuẩn bị bài hát</Typography.Text>
            )}
          </Flex>
          {programs.isPending && <SectionSkeleton rows={3} label="Đang tải việc cần xử lý" />}
          {programs.isError && (
            <ErrorState headingLevel={3} title="Không thể tải chương trình sắp tới" onRetry={() => programs.refetch()} retrying={programs.isFetching} />
          )}
          {programs.isSuccess && todos.length === 0 && (
            <EmptyState
              headingLevel={3}
              title="Không có việc tồn đọng"
              description="Các chương trình sắp tới đều đã gửi danh sách bài hát để duyệt hoặc đã được phê duyệt."
            />
          )}
          {programs.isSuccess && todos.length > 0 && (
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
            <ErrorState headingLevel={3} title="Không thể tải chương trình sắp tới" onRetry={() => programs.refetch()} retrying={programs.isFetching} />
          )}
          {programs.isSuccess && upcoming.length === 0 && (
            <EmptyState headingLevel={3} title="Chưa có chương trình sắp tới" description="Chương trình Cha xứ công bố sẽ xuất hiện tại đây." />
          )}
          {programs.isSuccess && upcoming.length > 0 && (
            <Card styles={{ body: { padding: 0 } }}>
              <ProgramTable
                programs={upcoming.slice(0, upcomingLimit)}
                onOpen={(program) => navigate(generatePath(paths.director.programDetail, { programId: program.id }))}
              />
            </Card>
          )}
        </section>

        <section aria-labelledby="shortcuts-heading">
          <Typography.Title id="shortcuts-heading" level={2} style={{ marginBottom: spacing.md }}>
            Truy cập nhanh
          </Typography.Title>
          <Row gutter={[spacing.md, spacing.md]}>
            {shortcuts.map(({ path, title, description, icon: Icon }) => (
              <Col key={path} xs={24} sm={12} xl={6}>
                <Link to={path} style={{ display: 'block', height: '100%' }}>
                  <Card hoverable style={{ height: '100%' }} styles={{ body: { padding: spacing.md } }}>
                    <Flex align="center" gap={spacing.sm} style={{ marginBottom: spacing.xs }}>
                      <span aria-hidden style={{ color: colors.primary, fontSize: 18 }}>
                        <Icon />
                      </span>
                      <Typography.Text strong>{title}</Typography.Text>
                    </Flex>
                    <Typography.Text style={{ color: colors.textMuted }}>{description}</Typography.Text>
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>
        </section>
      </Flex>
    </>
  )
}
