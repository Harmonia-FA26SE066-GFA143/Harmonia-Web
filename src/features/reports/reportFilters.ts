import dayjs from 'dayjs'
import type { ReportFilters } from './types'

export function hasActiveReportFilters(filters: ReportFilters): boolean {
  return Object.values(filters).some(Boolean)
}

const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/

/** The report view lives in the query string (tab and filters), so Back and a reload show it as it was. */
export function readReportFilters(params: URLSearchParams): ReportFilters {
  const month = params.get('month')
  return {
    month: month && monthPattern.test(month) ? month : undefined,
    seasonId: params.get('seasonId') ?? undefined,
    choirId: params.get('choirId') ?? undefined,
  }
}

export function writeReportParams(kind: string, filters: ReportFilters): URLSearchParams {
  const params = new URLSearchParams({ kind })
  for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value)
  return params
}

/** The query of `SearchReportsRequest`: a month is its first and last day, both inclusive. */
export function toReportQuery({ month, seasonId, fromDate, toDate, choirId }: ReportFilters) {
  const start = month ? dayjs(`${month}-01`) : undefined
  return {
    liturgicalSeasonId: seasonId,
    fromDate: fromDate ?? start?.format('YYYY-MM-DD'),
    toDate: toDate ?? start?.endOf('month').format('YYYY-MM-DD'),
    choirId,
  }
}
