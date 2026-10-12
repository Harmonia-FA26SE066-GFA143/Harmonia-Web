/**
 * The reports of Harmonia-BE (`ReportType`, ReportsController): service history and song usage for the Parish Priest
 * and the Admin (FE-22), the other four for the Admin only (FE-52). The backend has no "event preparation" report:
 * a published event shows its preparation on its page (FE-21), which supersedes that FE-22 tab.
 */
export type PriestReportKind = 'serviceHistory' | 'songUsage'

export type AdminReportKind = PriestReportKind | 'userActivity' | 'rehearsalAttendance' | 'participation' | 'assignmentCompletion'

export type ReportKind = AdminReportKind

/**
 * Filters of `SearchReportsRequest`. The month becomes `fromDate` / `toDate`; filtering by Mass or ceremony type is not
 * offered by the backend, and by event would need an event list the Admin cannot read.
 */
export interface ReportFilters {
  /** Month as YYYY-MM. */
  month?: string
  seasonId?: string
}

/** One report row: display-ready values keyed by column, computed by the backend (never derived here). */
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
  kind?: ReportKind
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
