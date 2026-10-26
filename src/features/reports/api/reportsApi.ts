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
  ReportColumn, ReportExport, ReportExportRequest, ReportFilters, ReportFormat, ReportRow } from '../types'

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

/** Cells are keyed by the JSON field names, the keys of `GET /api/reports/columns`; dates and labels are worded here. */
const toRow: Record<AdminReportKind, (dto: never) => ReportRow> = {
  serviceHistory: ({ eventId, eventDate, time, title, liturgicalSeasonName, ...rest }: ServiceHistoryDto) => ({
    id: eventId,
    programId: eventId,
    cells: {
      ...rest,
      eventDate: day(eventDate),
      time: time.slice(0, 5),
      title: title || 'Sự kiện phụng vụ',
      liturgicalSeasonName: liturgicalSeasonName ?? undefined,
    },
  }),
  songUsage: (dto: SongUsageDto) => ({
    id: dto.songId,
    cells: { title: dto.title, composer: dto.composer ?? undefined, timesUsed: dto.timesUsed, lastUsedDate: day(dto.lastUsedDate) },
  }),
  userActivity: ({ userId, roleName, isActive, lastLoginAt, ...rest }: UserActivityDto) => ({
    id: userId,
    cells: {
      ...rest,
      fullName: rest.fullName || undefined,
      roleName: roleLabels[roleByApiName[roleName as ApiRoleName]] ?? roleName,
      isActive: isActive ? 'Có' : 'Không',
      lastLoginAt: lastLoginAt ? formatDateTime(lastLoginAt) : undefined,
    },
  }),
  rehearsalAttendance: ({ memberId, ...cells }: MemberCountsDto) => ({ id: memberId, cells }),
  participation: ({ memberId, ...cells }: MemberCountsDto) => ({ id: memberId, cells }),
  assignmentCompletion: ({ memberId, ...cells }: MemberCountsDto) => ({ id: memberId, cells }),
}

export async function getReport(kind: AdminReportKind, filters: ReportFilters, page: ReportPage): Promise<PagedList<ReportRow>> {
  const result = await apiRequest<PagedList<never>>(`/api/reports/${paths[kind]}${toQuery({ ...toReportQuery(filters), ...page })}`)
  return { ...result, items: result.items.map(toRow[kind]) }
}

/** Column keys and Vietnamese titles of a report, the same as its exported file (any role that reads reports). */
export function getReportColumns(kind: AdminReportKind): Promise<ReportColumn[]> {
  return apiRequest<ReportColumn[]>(`/api/reports/columns/${apiType[kind]}`)
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
