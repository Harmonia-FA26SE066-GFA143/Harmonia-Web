import { PlusOutlined } from '@ant-design/icons'
import { Alert, Badge, Button, Calendar, Card, Flex, Grid, Typography } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useMemo, useState } from 'react'
import { generatePath, useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { ErrorState, PageHeader, SectionSkeleton } from '@/shared/ui'
import { colors, spacing } from '@/styles/tokens'
import { SongListStatusTag } from '../components/SongListStatusTag'
import { usePrograms } from '../hooks/usePrograms'
import type { LiturgicalProgram } from '../types'

const cellLimit = 2

/**
 * Priest: month calendar of the created liturgical programs (FE-15). It shows only programs: liturgical days,
 * ranks and colors are not calculated (Catholic calendar rules are not specified; calendar services are out of
 * scope, EX-08). Actor: Priest only for now; whether the Choir Director also gets this view is TBD.
 */
export function ProgramCalendarPage() {
  const navigate = useNavigate()
  const screens = Grid.useBreakpoint()
  const programs = usePrograms()
  const [selected, setSelected] = useState<Dayjs>(() => dayjs())

  const byDate = useMemo(() => {
    const map = new Map<string, LiturgicalProgram[]>()
    for (const program of programs.data ?? []) map.set(program.date, [...(map.get(program.date) ?? []), program])
    return map
  }, [programs.data])

  const selectedKey = selected.format('YYYY-MM-DD')
  const selectedPrograms = byDate.get(selectedKey) ?? []
  const openProgram = (program: LiturgicalProgram) =>
    navigate(generatePath(paths.priest.programDetail, { programId: program.id }))
  const createForDate = () => navigate(`${paths.priest.programCreate}?date=${selectedKey}`)

  const renderDate = (date: Dayjs) => {
    const items = byDate.get(date.format('YYYY-MM-DD')) ?? []
    if (items.length === 0) return null
    if (!screens.md) return <Badge color={colors.primary} aria-label={`${items.length} chương trình`} />
    return (
      <Flex vertical gap={2}>
        {items.slice(0, cellLimit).map((program) => (
          <Typography.Text key={program.id} ellipsis style={{ fontSize: 12, color: colors.primary }}>
            {program.eventName}
          </Typography.Text>
        ))}
        {items.length > cellLimit && (
          <Typography.Text style={{ fontSize: 12, color: colors.textMuted }}>+{items.length - cellLimit} khác</Typography.Text>
        )}
      </Flex>
    )
  }

  return (
    <>
      <PageHeader
        title="Lịch phụng vụ"
        breadcrumb={[{ title: 'Cha xứ' }, { title: 'Lịch phụng vụ' }]}
        description="Xem các chương trình phụng vụ theo tháng và tạo chương trình cho một ngày."
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(paths.priest.programCreate)}>
            Tạo chương trình
          </Button>
        }
      />
      {programs.isPending && <SectionSkeleton rows={8} label="Đang tải lịch phụng vụ" />}
      {programs.isError && (
        <ErrorState title="Không thể tải lịch phụng vụ" onRetry={() => programs.refetch()} retrying={programs.isFetching} />
      )}
      {programs.isSuccess && (
        <Flex vertical gap={spacing.lg}>
          {programs.data.length === 0 && (
            <Alert
              type="info"
              showIcon
              title="Chưa có chương trình phụng vụ nào."
              description="Chọn một ngày trên lịch rồi bấm “Tạo chương trình cho ngày này”."
            />
          )}
          <Card styles={{ body: { padding: screens.md ? spacing.md : spacing.sm } }}>
            <Calendar
              fullscreen={Boolean(screens.md)}
              value={selected}
              onSelect={setSelected}
              cellRender={(date, info) => (info.type === 'date' ? renderDate(date) : info.originNode)}
            />
          </Card>
          <Card title={`Ngày ${selected.format('DD/MM/YYYY')}`}>
            <Button icon={<PlusOutlined />} onClick={createForDate} style={{ marginBottom: spacing.md }}>
              Tạo chương trình cho ngày này
            </Button>
            {selectedPrograms.length === 0 ? (
              <Typography.Text style={{ color: colors.textMuted }}>Chưa có chương trình nào trong ngày này.</Typography.Text>
            ) : (
              <Flex component="ul" vertical gap={spacing.sm} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {selectedPrograms.map((program) => (
                  <Flex component="li" key={program.id} wrap align="center" justify="space-between" gap={spacing.sm}>
                    <Flex vertical>
                      <Typography.Text strong>{program.eventName}</Typography.Text>
                      <Flex align="center" gap={spacing.xs} wrap style={{ color: colors.textMuted }}>
                        Danh sách bài hát: <SongListStatusTag status={program.songListStatus} />
                      </Flex>
                    </Flex>
                    <Button onClick={() => openProgram(program)} aria-label={`Xem chi tiết ${program.eventName}`}>
                      Xem chi tiết
                    </Button>
                  </Flex>
                ))}
              </Flex>
            )}
          </Card>
        </Flex>
      )}
    </>
  )
}
