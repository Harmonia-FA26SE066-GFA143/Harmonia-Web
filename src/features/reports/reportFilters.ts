import type { ReportFilters } from './types'

export function hasActiveReportFilters(filters: ReportFilters): boolean {
  return Object.values(filters).some(Boolean)
}

const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/

/** The report view lives in the query string (tab, filters, search), so Back and a reload show it as it was. */
export function readReportFilters(params: URLSearchParams): ReportFilters {
  const month = params.get('month')
  return {
    month: month && monthPattern.test(month) ? month : undefined,
    seasonId: params.get('seasonId') ?? undefined,
    massTypeId: params.get('massTypeId') ?? undefined,
    ceremonyTypeId: params.get('ceremonyTypeId') ?? undefined,
  }
}

export function writeReportParams(kind: string, filters: ReportFilters, search = ''): URLSearchParams {
  const params = new URLSearchParams({ kind })
  for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value)
  if (search) params.set('search', search)
  return params
}
