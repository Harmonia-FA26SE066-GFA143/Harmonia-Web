import { CalendarOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Flex, Select, Typography } from 'antd'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import { generatePath, Link, useNavigate, useSearchParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { formatProgramDate, usePrograms } from '@/features/liturgical-programs'
import { formatRehearsalTime, isRehearsalDay, rehearsalLabel, useRehearsals, type Rehearsal } from '@/features/rehearsals'
import { EmptyState, ErrorState, PageHeader, SectionSkeleton } from '@/shared/ui'
import { colors, spacing } from '@/styles/tokens'
import { AttendanceSheet } from '../components/AttendanceSheet'
import { useAttendance } from '../hooks/useAttendance'

const breadcrumb = [{ title: 'Ca trưởng' }, { title: 'Điểm danh' }]

const hasStarted = (rehearsal: Rehearsal) => Date.parse(rehearsal.startAt) <= Date.now()

/** Today's session, otherwise the latest one that has started, otherwise the next one. */
function defaultSession(rehearsals: Rehearsal[]): Rehearsal | undefined {
  const now = Date.now()
  const started = rehearsals.filter((rehearsal) => Date.parse(rehearsal.startAt) <= now)
  return rehearsals.find((rehearsal) => isRehearsalDay(rehearsal)) ?? started.at(-1) ?? rehearsals[0]
}

/**
 * Choir Director: attendance of one rehearsal session (FE-45) on `/api/rehearsals/{id}/attendances`, with the four
 * Harmonia-BE `AttendanceStatus` values. The sessions themselves still come from the rehearsals fixture (B20).
 * `?rehearsalId=` selects the session (link from the rehearsal schedule).
 */
export function AttendancePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const rehearsals = useRehearsals()
  const programs = usePrograms()
  const sessions = useMemo(() => rehearsals.data ?? [], [rehearsals.data])
  const selected = sessions.find((rehearsal) => rehearsal.id === searchParams.get('rehearsalId')) ?? defaultSession(sessions)
  const attendance = useAttendance(selected?.id)
  const program = programs.data?.find((item) => item.id === selected?.programId)
  // The backend records attendance from the start of the session on, corrections included (RehearsalAttendanceService),
  // which supersedes "on the day of the session only" (decision 2026-09-30, 6a.6).
  const started = selected ? hasStarted(selected) : false

  const scheduleButton = (
    <Button icon={<CalendarOutlined />} onClick={() => navigate(paths.director.rehearsals)}>
      Đến lịch tập
    </Button>
  )

  return (
    <>
      <PageHeader
        title="Điểm danh"
        breadcrumb={breadcrumb}
        description="Ghi nhận thành viên có mặt thực tế tại buổi tập hoặc buổi chuẩn bị phục vụ."
        extra={scheduleButton}
      />
      {rehearsals.isPending && <SectionSkeleton rows={6} label="Đang tải buổi tập" />}
      {rehearsals.isError && (
        <ErrorState title="Không thể tải buổi tập" onRetry={() => rehearsals.refetch()} retrying={rehearsals.isFetching} />
      )}
      {rehearsals.isSuccess && !selected && (
        <EmptyState
          title="Chưa có buổi tập để điểm danh"
          description="Tạo buổi tập trong Lịch tập, sau đó quay lại đây để điểm danh."
          action={scheduleButton}
        />
      )}
      {selected && (
        <Flex vertical gap={spacing.md}>
          <Card>
            <Flex wrap gap={spacing.md} align="center" justify="space-between">
              <Select
                showSearch
                optionFilterProp="label"
                aria-label="Chọn buổi tập"
                value={selected.id}
                onChange={(rehearsalId: string) => setSearchParams({ rehearsalId })}
                options={sessions.map((rehearsal) => ({ value: rehearsal.id, label: rehearsalLabel(rehearsal) }))}
                style={{ flex: '1 1 280px', maxWidth: 420, minWidth: 0 }}
              />
              <Flex vertical gap={2} style={{ flex: '1 1 280px' }}>
                <Typography.Text>{formatRehearsalTime(selected)}</Typography.Text>
                <Typography.Text style={{ color: colors.textMuted }}>
                  {[selected.location, program && `${program.eventName} · ${formatProgramDate(program.date)}`]
                    .filter(Boolean)
                    .join(' · ')}
                  {program && (
                    <>
                      {' · '}
                      <Link to={generatePath(paths.director.programDetail, { programId: program.id })}>Xem chương trình</Link>
                    </>
                  )}
                </Typography.Text>
              </Flex>
            </Flex>
          </Card>
          {attendance.isPending && <SectionSkeleton rows={8} label="Đang tải danh sách điểm danh" />}
          {attendance.isError && (
            <ErrorState
              title="Không thể tải danh sách điểm danh"
              onRetry={() => attendance.refetch()}
              retrying={attendance.isFetching}
            />
          )}
          {attendance.isSuccess && attendance.data.length === 0 && (
            <EmptyState title="Chưa có thành viên trong danh sách điểm danh" />
          )}
          {attendance.isSuccess && !started && (
            <Alert
              type="info"
              showIcon
              title={`Điểm danh được từ khi buổi tập bắt đầu (${dayjs(selected.startAt).format('HH:mm DD/MM/YYYY')}).`}
            />
          )}
          {attendance.isSuccess && attendance.data.length > 0 && (
            // Remount after a save or a session change so the draft starts from the saved values.
            <AttendanceSheet
              key={`${selected.id}-${attendance.dataUpdatedAt}`}
              rehearsalId={selected.id}
              records={attendance.data}
              editable={started}
            />
          )}
        </Flex>
      )}
    </>
  )
}
