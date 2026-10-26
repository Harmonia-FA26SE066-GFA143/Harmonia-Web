import dayjs from 'dayjs'
import { apiDownload, apiRequest } from '@/lib/api/client'
import { formatDateTime } from '@/lib/api/dates'
import { toQuery, type PagedList } from '@/lib/api/paging'
import type { ApiRoleName } from '@/lib/auth/session'
import { roleByApiName, roleLabels } from '@/shared/types/account'
import { toReportQuery } from '../reportFilters'
import type {
  ActivityTrendPoint,
  ActivityTrendQuery,
  AdminReportKind,
  TrendPeriod,
  ReportExport, ReportExportRequest, ReportFilters, ReportFormat, ReportRow } from '../types'

// `/api/reports` (Harmonia-BE ReportsController): six paged reports over past data, an export to a file and the list
// of exports. Service history and song usage are open to the Parish Priest and the Admin, the rest to the Admin; the
// three per-member reports and their export also to the Choir Director.

export interface ReportPage {
  pageNumber: number
  pageSize: number
}

const paths: Record<AdminReportKind, string> = {
  serviceHistory: 'service-history',
  songUsage: 'song-usage',
  userActivity: 'user-activity',
  rehearsalAttendance: 'rehearsal-attendance',
  participation: 'participation',
  assignmentCompletion: 'assignment-completion',
}

type ApiReportType =
  | 'ServiceHistory'
  | 'SongUsage'
  | 'UserActivity'
  | 'RehearsalAttendance'
  | 'Participation'
  | 'AssignmentCompletion'

const kindByApi: Record<ApiReportType, AdminReportKind> = {
  ServiceHistory: 'serviceHistory',
  SongUsage: 'songUsage',
  UserActivity: 'userActivity',
  RehearsalAttendance: 'rehearsalAttendance',
  Participation: 'participation',
  AssignmentCompletion: 'assignmentCompletion',
}

const apiType = Object.fromEntries(Object.entries(kindByApi).map(([api, kind]) => [kind, api])) as Record<AdminReportKind, ApiReportType>

type ApiFormat = 'Csv' | 'Xlsx' | 'Pdf' | 'Xml' | 'Json'

const formatByApi: Record<ApiFormat, ReportFormat> = { Csv: 'csv', Xlsx: 'xlsx', Pdf: 'pdf', Xml: 'xml', Json: 'json' }

const apiFormat = Object.fromEntries(Object.entries(formatByApi).map(([api, format]) => [format, api])) as Record<
  ReportFormat,
  ApiFormat
>

const day = (date?: string | null) => (date ? dayjs(date).format('DD/MM/YYYY') : undefined)

interface ServiceHistoryDto {
  eventId: string
  eventDate: string
  time: string
  title: string | null
  liturgicalSeasonName: string | null
  locationName: string
  songCount: number
  membersServed: number
  participationConfirmed: number
  participationDeclined: number
  rehearsalsHeld: number
  attendancePresent: number
}

interface SongUsageDto {
  songId: string
  title: string
  composer: string | null
  timesUsed: number
  lastUsedDate: string | null
}

interface UserActivityDto {
  userId: string
  fullName: string
  email: string
  roleName: string
  isActive: boolean
  lastLoginAt: string | null
  passwordChangeCount: number
  passwordResetCount: number
  accountChangeCount: number
  actionCount: number
}

interface MemberCountsDto {
  memberId: string
  fullName: string
  [count: string]: string | number
}

const toRow: Record<AdminReportKind, (dto: never) => ReportRow> = {
  serviceHistory: (dto: ServiceHistoryDto) => ({
    id: dto.eventId,
    programId: dto.eventId,
    cells: {
      event: dto.title || 'Sự kiện phụng vụ',
      date: `${day(dto.eventDate)} ${dto.time.slice(0, 5)}`,
      season: dto.liturgicalSeasonName ?? undefined,
      location: dto.locationName,
      songs: dto.songCount,
      served: dto.membersServed,
      confirmed: dto.participationConfirmed,
      declined: dto.participationDeclined,
      rehearsals: dto.rehearsalsHeld,
      present: dto.attendancePresent,
    },
  }),
  songUsage: (dto: SongUsageDto) => ({
    id: dto.songId,
    cells: { song: dto.title, composer: dto.composer ?? undefined, timesUsed: dto.timesUsed, lastUsed: day(dto.lastUsedDate) },
  }),
  userActivity: (dto: UserActivityDto) => ({
    id: dto.userId,
    cells: {
      user: dto.fullName || undefined,
      email: dto.email,
      role: roleLabels[roleByApiName[dto.roleName as ApiRoleName]] ?? dto.roleName,
      status: dto.isActive ? 'Đang hoạt động' : 'Đã khoá',
      lastLogin: dto.lastLoginAt ? formatDateTime(dto.lastLoginAt) : undefined,
      passwordChanges: dto.passwordChangeCount,
      passwordResets: dto.passwordResetCount,
      accountChanges: dto.accountChangeCount,
      actions: dto.actionCount,
    },
  }),
  rehearsalAttendance: (dto: MemberCountsDto) => ({
    id: dto.memberId,
    cells: { member: dto.fullName, present: dto.presentCount, late: dto.lateCount, excused: dto.excusedCount, absent: dto.absentCount },
  }),
  participation: (dto: MemberCountsDto) => ({
    id: dto.memberId,
    cells: {
      member: dto.fullName,
      confirmed: dto.confirmedCount,
      declined: dto.declinedCount,
      unsure: dto.unsureCount,
      invited: dto.invitedCount,
    },
  }),
  assignmentCompletion: (dto: MemberCountsDto) => ({
    id: dto.memberId,
    cells: {
      member: dto.fullName,
      assigned: dto.assignedCount,
      passed: dto.passedCount,
      needsRevision: dto.needsRevisionCount,
      awaitingReview: dto.awaitingReviewCount,
      notSubmitted: dto.notSubmittedCount,
    },
  }),
}

export async function getReport(kind: AdminReportKind, filters: ReportFilters, page: ReportPage): Promise<PagedList<ReportRow>> {
  const result = await apiRequest<PagedList<never>>(`/api/reports/${paths[kind]}${toQuery({ ...toReportQuery(filters), ...page })}`)
  return { ...result, items: result.items.map(toRow[kind]) }
}

/**
 * Every matching row, as a file; the backend records the export (REPORT_NO_DATA when nothing matches). The Choir
 * Director may export the three per-member reports only (REPORT_TYPE_NOT_SUPPORTED otherwise).
 */
export function exportReport({ kind, format, filters }: ReportExportRequest): Promise<Blob> {
  return apiDownload(`/api/reports/export${toQuery({ ...toReportQuery(filters), type: apiType[kind], format: apiFormat[format] })}`)
}

interface ReportExportDto {
  id: string
  reportType: ApiReportType
  format: ApiFormat
  liturgicalSeasonId: string | null
  fromDate: string | null
  toDate: string | null
  exportedByName: string
  exportedAt: string
  downloadUrl: string
}

/** Admin only; newest first. */
export async function listExports(page: ReportPage): Promise<PagedList<ReportExport>> {
  const result = await apiRequest<PagedList<ReportExportDto>>(`/api/reports/exports${toQuery({ ...page })}`)
  return {
    ...result,
    items: result.items.map((dto) => ({
      id: dto.id,
      kind: kindByApi[dto.reportType],
      format: formatByApi[dto.format],
      seasonId: dto.liturgicalSeasonId ?? undefined,
      fromDate: dto.fromDate ?? undefined,
      toDate: dto.toDate ?? undefined,
      exportedByName: dto.exportedByName,
      exportedAt: dto.exportedAt,
      downloadUrl: dto.downloadUrl,
    })),
  }
}

type ApiTrendPeriod = 'Week' | 'Month' | 'Year'

const apiPeriod: Record<TrendPeriod, ApiTrendPeriod> = { week: 'Week', month: 'Month', year: 'Year' }

interface ActivityTrendDto extends Omit<ActivityTrendPoint, 'attendanceRate' | 'completionRate'> {
  attendanceRate: number | null
  completionRate: number | null
}

/**
 * One row per period, oldest first, empty periods included (Admin, Choir Director: their own members; `choirId`
 * narrows to a choir, CHOIR_NOT_FOUND for a Choir Director's choir of someone else). Weeks start on Monday.
 */
export async function getActivityTrend({ groupBy, fromDate, toDate, choirId }: ActivityTrendQuery): Promise<ActivityTrendPoint[]> {
  const rows = await apiRequest<ActivityTrendDto[]>(
    `/api/reports/activity-trend${toQuery({ groupBy: apiPeriod[groupBy], fromDate, toDate, choirId })}`,
  )
  return rows.map(({ attendanceRate, completionRate, ...rest }) => ({
    ...rest,
    attendanceRate: attendanceRate ?? undefined,
    completionRate: completionRate ?? undefined,
  }))
}
