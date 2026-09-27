import { env } from '@/config/env'
import { ApiContractMissingError } from '@/lib/api/errors'
import type { ReportExportRequest, ReportFilters, ReportKind, ReportResult } from '../types'

// TBD: Backend API missing – reports for the Admin (FE-52–FE-53) and the Priest (FE-22).
// Decision 0002: no endpoint is guessed. Each function checks `import.meta.env.DEV` at the call site so the
// fixture import is dropped from dist/.

export async function getReport(kind: ReportKind, filters: ReportFilters): Promise<ReportResult> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { getReportFixture } = await import('./fixtures.dev')
    return getReportFixture(kind, filters)
  }
  throw new ApiContractMissingError('Xem báo cáo')
}

/** Requests an export. File format and delivery (download, email) are TBD with the backend. */
export async function exportReport(request: ReportExportRequest): Promise<void> {
  if (import.meta.env.DEV && env.useDevFixtures) {
    const { exportReportFixture } = await import('./fixtures.dev')
    return exportReportFixture(request)
  }
  throw new ApiContractMissingError('Xuất báo cáo')
}
