/**
 * The reports of Harmonia-BE (`ReportType`, ReportsController): service history and song usage for the Parish Priest
 * and the Admin (FE-22), the other four for the Admin (FE-52); the three per-member ones also for the Choir Director
 * (BE 446f429). The backend has no "event preparation" report:
 * a published event shows its preparation on its page (FE-21), which supersedes that FE-22 tab.
 */
export type PriestReportKind = 'serviceHistory' | 'songUsage'

/** Per-member reports, which the Choir Director may also read and export, narrowed to a choir with `choirId`. */
export type DirectorReportKind = 'rehearsalAttendance' | 'participation' | 'assignmentCompletion'

export type AdminReportKind = PriestReportKind | DirectorReportKind | 'userActivity'

/**
 * Filters of `SearchReportsRequest`. The month becomes `fromDate` / `toDate`; filtering by Mass or ceremony type is not
 * offered by the backend, and by event would need an event list the Admin cannot read.
 */
export interface ReportFilters {
  /** Month as YYYY-MM. */
  month?: string
  seasonId?: string
  /** Inclusive YYYY-MM-DD bounds, used instead of the month (the Choir Director picks a week, month or year). */
  fromDate?: string
  toDate?: string
  /** Per-member reports only: members active in this choir. */
  choirId?: string
}

/** One report row: display-ready values keyed by column, computed by the backend (never derived here). */
/** A report column (`ReportColumnDto`): `key` is the JSON field of the report rows, `title` the heading of the export. */
export interface ReportColumn {
  key: string
  title: string
}

export interface ReportRow {
  id: string
  /** The event a service-history row is about, for a link to its page. */
  programId?: string
  cells: Record<string, string | number | undefined>
}

/** `ReportFormat` of Harmonia-BE. */
export type ReportFormat = 'csv' | 'xlsx' | 'pdf' | 'xml' | 'json'

export const reportFormatLabels: Record<ReportFormat, string> = {
  csv: 'CSV',
  xlsx: 'Excel (XLSX)',
  pdf: 'PDF',
  xml: 'XML',
  json: 'JSON',
}

export interface ReportExportRequest {
  kind: AdminReportKind
  format: ReportFormat
  filters: ReportFilters
}

/** One file an Admin exported (`ReportExportDto`). */
export interface ReportExport {
  id: string
  kind?: AdminReportKind
  format?: ReportFormat
  fromDate?: string
  toDate?: string
  seasonId?: string
  exportedByName: string
  /** Backend `DateTime`; read it with `parseUtc`. */
  exportedAt: string
  /** Short-lived link to the stored file. */
  downloadUrl: string
}

/** `ReportPeriod` of `GET /api/reports/activity-trend`. */
export type TrendPeriod = 'week' | 'month' | 'year'

/**
 * Attendance and practice of the reported members in one period (`ActivityTrendDto`): rehearsals starting in it and
 * assignments due in it, judged as in the per-member reports. Rates are 0–1, absent when nothing was recorded.
 */
export interface ActivityTrendPoint {
  /** YYYY-MM-DD, clipped to the requested range. */
  periodStart: string
  periodEnd: string
  rehearsalsRecorded: number
  presentCount: number
  lateCount: number
  absentCount: number
  excusedCount: number
  attendanceRate?: number
  assignmentsDue: number
  assignedCount: number
  passedCount: number
  needsRevisionCount: number
  awaitingReviewCount: number
  notSubmittedCount: number
  completionRate?: number
}

export interface ActivityTrendQuery {
  groupBy: TrendPeriod
  /** Inclusive YYYY-MM-DD; at most three years apart. */
  fromDate: string
  toDate: string
  choirId?: string
}
