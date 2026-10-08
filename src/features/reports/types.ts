/**
 * Admin reports listed in Report 1 FE-52: user activity, attendance, participation confirmation, assignment completion.
 * Names follow `ReportType` of Harmonia-BE (modelled, no controller yet).
 */
export type AdminReportKind = 'rehearsalAttendance' | 'userActivity' | 'participation' | 'assignmentCompletion'

/**
 * Priest reports listed in Report 1 FE-22: service history, song usage, event preparation. `ReportType` of
 * Harmonia-BE has no event preparation; it stays as FE-22 describes it until a reports API decides.
 */
export type PriestReportKind = 'serviceHistory' | 'songUsage' | 'eventPreparation'

export type ReportKind = AdminReportKind | PriestReportKind

/**
 * Server-side report filters. FE-53 names month, event and liturgical season for exports; mass/ceremony type
 * follow the priest Stitch screen. Filtering by event needs a program list API (TBD), so it is not offered yet.
 */
export interface ReportFilters {
  /** Month as YYYY-MM. */
  month?: string
  seasonId?: string
  massTypeId?: string
  ceremonyTypeId?: string
}

/**
 * One report row with display-ready values keyed by column (see reportDefinitions).
 * TBD: Backend API missing – statuses and dates arrive as text until the contract defines them.
 */
export interface ReportRow {
  id: string
  /** Liturgical program the row refers to, for a link to its detail page. */
  programId?: string
  cells: Record<string, string | undefined>
}

/**
 * Report data as computed by the backend. The frontend never derives metrics: their definitions are
 * UNRESOLVED, so values are shown exactly as returned.
 */
export interface ReportResult {
  metrics: Record<string, number | undefined>
  rows: ReportRow[]
}

/** Export scope (FE-53). By-event export is TBD until a program list API exists. */
export type ReportExportScope = { type: 'month'; month: string } | { type: 'season'; seasonId: string }

export interface ReportExportRequest {
  kind: AdminReportKind
  scope: ReportExportScope
}
