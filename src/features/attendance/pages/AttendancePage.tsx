import { Alert, Button, Flex } from 'antd'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { useUpcomingPrograms } from '@/features/liturgical-programs'
import { isRehearsalDay, useRecentRehearsals, type Rehearsal } from '@/features/rehearsals'
import { usePublicSettings } from '@/features/settings'
import { ApiError } from '@/lib/api/errors'
import { EmptyState, EmptyWeek, ErrorState, Icon, PageHeader, SectionSkeleton } from '@/shared/ui'
import { spacing } from '@/styles/tokens'
import { AttendanceSheet } from '../components/AttendanceSheet'
import { SessionPicker, SessionSummary } from '../components/SessionPicker'
import { useAttendance } from '../hooks/useAttendance'

const breadcrumb = [{ title: 'Ca trưởng' }, { title: 'Điểm danh' }]

const hasNotStarted = (rehearsal: Rehearsal) => Date.parse(rehearsal.startAt) > Date.now()
const isBefore = (time?: number) => time !== undefined && Date.now() < time

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
  // B49, done in BE 14dabd3: the two settings that open attendance are public to signed-in users. While they are not
  // read (or an older backend leaves them out) the sheet is not locked and the server decides on save
  // (409 REHEARSAL_NOT_STARTED, RehearsalAttendanceService.cs:54-59).
  const settings = usePublicSettings().data
  const beforeStart = selected ? hasNotStarted(selected) : false
  const opensAt =
    selected && settings?.attendanceStartCheck
      ? Date.parse(selected.startAt) - (settings.attendanceOpensMinutesBefore ?? 0) * 60_000
      : undefined
  const notOpen = isBefore(opensAt)
  const settingsKnown = settings?.attendanceStartCheck !== undefined

  const pick = (nextId: string) => {
    const next = new URLSearchParams(searchParams)
    next.set('rehearsalId', nextId)
    setSearchParams(next)
  }
  const picker = selected && <SessionPicker session={selected} sessions={sessions} onPick={pick} />
  const showSheet = attendance.data !== undefined && attendance.data.length > 0

  const scheduleButton = (
    <Button icon={<Icon name="calendar" />} onClick={() => navigate(paths.director.rehearsals)}>
      Đến lịch tập
    </Button>
  )

  return (
    <>
      <PageHeader
        title="Điểm danh"
        breadcrumb={breadcrumb}
        description={
          selected ? (
            <SessionSummary session={selected} program={program && selected.eventId === program.id ? program : undefined} />
          ) : undefined
        }
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
      {rehearsals.isPending && <SectionSkeleton rows={6} label="Đang tải buổi tập" />}
      {rehearsals.isError && (
        <ErrorState title="Không thể tải buổi tập" error={rehearsals.error} hasData={rehearsals.data !== undefined} onRetry={() => rehearsals.refetch()} retrying={rehearsals.isFetching} />
      )}
      {rehearsals.data !== undefined && !selected && (
        <EmptyState
          icon={<EmptyWeek />} title="Chưa có buổi tập để điểm danh"
          description="Tạo buổi tập trong Lịch tập, sau đó quay lại đây để điểm danh."
          action={scheduleButton}
        />
      )}
      {selected && (
        <Flex vertical gap={spacing.lg}>
          {!showSheet && <div className="ctb-filters">{picker}</div>}
          {attendance.isPending && <SectionSkeleton rows={8} label="Đang tải danh sách điểm danh" />}
          {/* The session is listed for every director of a serving choir; its sheet is the lead director's. */}
          {attendance.isError && attendance.error instanceof ApiError && attendance.error.code === 'CHOIR_NOT_LEAD' && (
            <Alert type="info" showIcon title="Buổi tập chung do ca trưởng của ca đoàn phụ trách chương trình điểm danh" description="Chọn một buổi tập khác của ca đoàn bạn ở ô phía trên." />
          )}
          {attendance.isError && !(attendance.error instanceof ApiError && attendance.error.code === 'CHOIR_NOT_LEAD') && (
            <ErrorState
              title="Không thể tải danh sách điểm danh"
              error={attendance.error} hasData={attendance.data !== undefined} onRetry={() => attendance.refetch()}
              retrying={attendance.isFetching}
            />
          )}
          {attendance.data !== undefined && attendance.data.length === 0 && (
            <EmptyState title="Chưa có thành viên trong danh sách điểm danh" />
          )}
          {attendance.data !== undefined && notOpen && (
            <Alert
              type="info"
              showIcon
              title={`Điểm danh mở lúc ${dayjs(opensAt).format('HH:mm DD/MM/YYYY')}.`}
              description="Trước giờ này chỉ xem được danh sách; máy chủ chưa nhận điểm danh."
            />
          )}
          {attendance.data !== undefined && beforeStart && !settingsKnown && (
            <Alert
              type="info"
              showIcon
              title={`Buổi tập bắt đầu lúc ${dayjs(selected.startAt).format('HH:mm DD/MM/YYYY')}.`}
              description="Giờ mở điểm danh tuỳ cấu hình của Admin. Nếu chưa tới giờ, máy chủ sẽ từ chối khi lưu và các đánh dấu vẫn giữ trên trang."
            />
          )}
          {showSheet && (
            // One sheet per session: its unsaved marks stay through a reload of the records.
            <AttendanceSheet
              key={selected.id}
              rehearsalId={selected.id}
              records={attendance.data}
              picker={picker}
              readOnly={notOpen}
            />
          )}
        </Flex>
      )}
    </>
  )
}
