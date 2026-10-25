import { CalendarOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Flex, Select, Typography } from 'antd'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import { generatePath, Link, useNavigate, useSearchParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { formatProgramDate, useUpcomingPrograms } from '@/features/liturgical-programs'
import { formatRehearsalTime, isRehearsalDay, rehearsalLabel, useRecentRehearsals, type Rehearsal } from '@/features/rehearsals'
import { EmptyState, ErrorState, PageHeader, SectionSkeleton } from '@/shared/ui'
import { colors, spacing } from '@/styles/tokens'
import { AttendanceSheet } from '../components/AttendanceSheet'
import { useAttendance } from '../hooks/useAttendance'

const breadcrumb = [{ title: 'Ca trưởng' }, { title: 'Điểm danh' }]

// The Admin may open attendance up to 120 minutes early (Harmonia-BE SystemSettingKeys,
// Rehearsal.AttendanceOpensMinutesBefore, which the Choir Director cannot read): the sheet opens at the earliest
// moment and the backend refuses a save made too early (REHEARSAL_NOT_STARTED).
const maxMinutesEarly = 120
const attendanceMayOpen = (rehearsal: Rehearsal) =>
  Date.parse(rehearsal.startAt) - maxMinutesEarly * 60_000 <= Date.now()

/** Today's session, otherwise the latest one that has started, otherwise the next one. */
function defaultSession(rehearsals: Rehearsal[]): Rehearsal | undefined {
  const now = Date.now()
  const started = rehearsals.filter((rehearsal) => Date.parse(rehearsal.startAt) <= now)
  return rehearsals.find((rehearsal) => isRehearsalDay(rehearsal)) ?? started.at(-1) ?? rehearsals[0]
}

/**
 * Choir Director: attendance of one rehearsal session (FE-45) on `/api/rehearsals/{id}/attendances`, with the four
 * Harmonia-BE `AttendanceStatus` values. The picker offers sessions from 30 days back to 7 days ahead;
 * `?rehearsalId=` selects the session (link from the rehearsal schedule).
 */
export function AttendancePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const rehearsals = useRecentRehearsals()
  const programs = useUpcomingPrograms()
  const sessions = useMemo(() => rehearsals.data ?? [], [rehearsals.data])
  const rehearsalId = searchParams.get('rehearsalId')
  const programId = searchParams.get('programId')

  const selected =
    sessions.find((rehearsal) => rehearsal.id === rehearsalId) ??
    (programId ? sessions.find((rehearsal) => rehearsal.eventId === programId) : undefined) ??
    defaultSession(sessions)

  const attendance = useAttendance(selected?.id)
  const program = programs.data?.find((item) => item.id === (selected?.eventId ?? programId))
  // The backend records attendance from the start of the session on, corrections included (RehearsalAttendanceService),
  // which supersedes "on the day of the session only" (decision 2026-09-30, 6a.6).
  const started = selected ? attendanceMayOpen(selected) : false

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
      {programId && !sessions.some((r) => r.eventId === programId) && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: spacing.md }}
          title={
            program
              ? `Chương trình “${program.eventName}” chưa có buổi tập nào trong lịch điểm danh gần đây.`
              : 'Chương trình này chưa có buổi tập nào trong lịch điểm danh gần đây.'
          }
          description="Chỉ những buổi tập từ 30 ngày trước đến 7 ngày tới mới xuất hiện để điểm danh."
          action={
            <Button
              size="small"
              onClick={() => navigate(`${paths.director.rehearsals}?programId=${programId}`)}
            >
              Đến lịch tập
            </Button>
          }
        />
      )}
      {program && selected?.eventId === program.id && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: spacing.md }}
          title={
            <Flex wrap align="center" justify="space-between" gap={spacing.sm}>
              <Typography.Text>
                Điểm danh buổi tập cho chương trình:{' '}
                <strong>{program.eventName}</strong> · {formatProgramDate(program.date)}
              </Typography.Text>
              <Link to={generatePath(paths.director.programDetail, { programId: program.id })}>
                Xem chi tiết chương trình
              </Link>
            </Flex>
          }
        />
      )}
      {rehearsals.isPending && <SectionSkeleton rows={6} label="Đang tải buổi tập" />}
      {rehearsals.isError && (
        <ErrorState title="Không thể tải buổi tập" error={rehearsals.error} hasData={rehearsals.data !== undefined} onRetry={() => rehearsals.refetch()} retrying={rehearsals.isFetching} />
      )}
      {rehearsals.data !== undefined && !selected && (
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
                onChange={(nextId: string) => {
                  const next = new URLSearchParams(searchParams)
                  next.set('rehearsalId', nextId)
                  setSearchParams(next)
                }}
                options={sessions.map((rehearsal) => ({ value: rehearsal.id, label: rehearsalLabel(rehearsal) }))}
                style={{ flex: '1 1 280px', maxWidth: 420, minWidth: 0 }}
              />
              <Flex vertical gap={2} style={{ flex: '1 1 280px' }}>
                <Typography.Text>{formatRehearsalTime(selected)}</Typography.Text>
                <Typography.Text style={{ color: colors.textMuted }}>
                  {[selected.locationName, program && `${program.eventName} · ${formatProgramDate(program.date)}`]
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
              error={attendance.error} hasData={attendance.data !== undefined} onRetry={() => attendance.refetch()}
              retrying={attendance.isFetching}
            />
          )}
          {attendance.data !== undefined && attendance.data.length === 0 && (
            <EmptyState title="Chưa có thành viên trong danh sách điểm danh" />
          )}
          {attendance.data !== undefined && !started && (
            <Alert
              type="info"
              showIcon
              title={`Điểm danh được từ khi buổi tập bắt đầu (${dayjs(selected.startAt).format('HH:mm DD/MM/YYYY')}), hoặc sớm hơn nếu Admin cho phép.`}
            />
          )}
          {attendance.data !== undefined && attendance.data.length > 0 && (
            // One sheet per session: its unsaved marks stay through a reload of the records.
            <AttendanceSheet
              key={selected.id}
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
