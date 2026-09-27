import { BarChartOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Card, Flex, Typography } from 'antd'
import { useMemo } from 'react'
import { generatePath, useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { ProgramTable, upcomingPrograms, usePrograms, type LiturgicalProgram } from '@/features/liturgical-programs'
import { EmptyState, ErrorState, PageHeader, PageSkeleton } from '@/shared/ui'
import { colors, spacing, typography } from '@/styles/tokens'

const upcomingLimit = 5

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card style={{ flex: '1 1 200px' }} styles={{ body: { padding: spacing.md } }}>
      <Typography.Text style={{ color: colors.textMuted }}>{label}</Typography.Text>
      <div style={{ marginTop: spacing.xs, fontFamily: typography.fontFamilyNumeric, fontSize: 28, fontWeight: 700 }}>
        {value}
      </div>
    </Card>
  )
}

/**
 * Priest dashboard: upcoming programs and song lists waiting for review (FE-15, FE-17), with a link to reports
 * (FE-22). Counts are plain filters of the program list. "Preparation status" from Stitch is not shown: its
 * values are not defined (TBD).
 */
export function PriestDashboardPage() {
  const navigate = useNavigate()
  const programs = usePrograms()
  const all = useMemo(() => programs.data ?? [], [programs.data])
  const upcoming = useMemo(() => upcomingPrograms(all), [all])
  const toReview = useMemo(() => all.filter((program) => program.songListStatus === 'submitted'), [all])

  const openProgram = (program: LiturgicalProgram) =>
    navigate(generatePath(paths.priest.programDetail, { programId: program.id }))
  const createButton = (
    <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(paths.priest.programCreate)}>
      Tạo chương trình
    </Button>
  )
  const header = (
    <PageHeader
      title="Tổng quan"
      breadcrumb={[{ title: 'Cha xứ' }, { title: 'Tổng quan' }]}
      description="Theo dõi các chương trình phụng vụ sắp tới và danh sách bài hát cần xem xét."
      extra={createButton}
    />
  )

  if (programs.isPending) return <PageSkeleton sections={2} />
  if (programs.isError) {
    return (
      <>
        {header}
        <ErrorState title="Không thể tải tổng quan" onRetry={() => programs.refetch()} retrying={programs.isFetching} />
      </>
    )
  }

  return (
    <>
      {header}
      <Flex vertical gap={spacing.xl}>
        <Flex wrap gap={spacing.md}>
          <Metric label="Chương trình sắp tới" value={upcoming.length} />
          <Metric label="Danh sách bài hát chờ xem xét" value={toReview.length} />
        </Flex>

        <section aria-labelledby="to-review-heading">
          <Typography.Title id="to-review-heading" level={2} style={{ marginBottom: spacing.md }}>
            Cần xem xét
          </Typography.Title>
          {toReview.length === 0 ? (
            <EmptyState
              title="Không có danh sách bài hát nào chờ xem xét"
              description="Khi Ca trưởng gửi danh sách bài hát, chương trình sẽ xuất hiện tại đây."
            />
          ) : (
            <Flex vertical gap={spacing.sm}>
              {toReview.map((program) => (
                <Card key={program.id} styles={{ body: { padding: spacing.md } }}>
                  <Flex wrap align="center" justify="space-between" gap={spacing.sm}>
                    <div>
                      <Typography.Text strong>{program.eventName}</Typography.Text>
                      <Typography.Paragraph style={{ margin: 0, color: colors.textMuted }}>
                        Ca trưởng đã gửi danh sách bài hát để xem xét.
                      </Typography.Paragraph>
                    </div>
                    <Button
                      type="primary"
                      onClick={() => navigate(generatePath(paths.priest.songListReview, { programId: program.id }))}
                    >
                      Xem danh sách bài hát
                    </Button>
                  </Flex>
                </Card>
              ))}
            </Flex>
          )}
        </section>

        <section aria-labelledby="upcoming-heading">
          <Flex wrap align="center" justify="space-between" gap={spacing.sm} style={{ marginBottom: spacing.md }}>
            <Typography.Title id="upcoming-heading" level={2} style={{ margin: 0 }}>
              Chương trình sắp tới
            </Typography.Title>
            <Button onClick={() => navigate(paths.priest.programs)}>Xem tất cả</Button>
          </Flex>
          {upcoming.length === 0 ? (
            <EmptyState
              title="Chưa có chương trình sắp tới"
              description="Tạo chương trình phụng vụ để Ca trưởng bắt đầu chuẩn bị."
              action={createButton}
            />
          ) : (
            <Card styles={{ body: { padding: 0 } }}>
              <ProgramTable programs={upcoming.slice(0, upcomingLimit)} onOpen={openProgram} pageSize={upcomingLimit} />
            </Card>
          )}
        </section>

        <Card styles={{ body: { padding: spacing.lg } }}>
          <Flex wrap align="center" justify="space-between" gap={spacing.md}>
            <Flex align="center" gap={spacing.md}>
              <span aria-hidden style={{ fontSize: 22, color: colors.primary }}>
                <BarChartOutlined />
              </span>
              <div>
                <Typography.Text strong>Báo cáo</Typography.Text>
                <Typography.Paragraph style={{ margin: 0, color: colors.textMuted }}>
                  Lịch sử phục vụ, sử dụng bài hát và tình trạng chuẩn bị của ca đoàn.
                </Typography.Paragraph>
              </div>
            </Flex>
            <Button onClick={() => navigate(paths.priest.reports)}>Xem báo cáo</Button>
          </Flex>
        </Card>
      </Flex>
    </>
  )
}
