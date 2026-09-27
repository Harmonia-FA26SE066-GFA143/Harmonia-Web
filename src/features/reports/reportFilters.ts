import type { ReportFilters } from './types'

export function hasActiveReportFilters(filters: ReportFilters): boolean {
  return Object.values(filters).some(Boolean)
}
