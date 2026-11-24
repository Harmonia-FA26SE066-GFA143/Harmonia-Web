import type { Dayjs } from 'dayjs'
import { UNKNOWN_METRIC_LABEL } from '@/shared/ui/glossary'
import type { ReportRow } from './types'

/** A whole percentage, or "no data" when there is nothing to divide by (R2.6). */
export const percent = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : UNKNOWN_METRIC_LABEL)

/** A count cell of a per-member report row. */
export const cellCount = (row: ReportRow, key: string) => Number(row.cells[key] ?? 0)

/** Answers to participation requests, summed over the loaded rows of `GET /api/reports/participation`. */
export function participationTotals(rows: ReportRow[]) {
  const sum = (key: string) => rows.reduce((acc, row) => acc + cellCount(row, key), 0)
  const invited = sum('invitedCount')
  const confirmed = sum('confirmedCount')
  const declined = sum('declinedCount')
  const unsure = sum('unsureCount')
  return { invited, confirmed, declined, unsure, sent: invited + confirmed + declined + unsure }
}

/** The members counted, saying so when only the first page of a larger report was loaded. */
export const memberScope = (loaded: number, totalCount: number) =>
  totalCount > loaded ? `trong ${loaded}/${totalCount} ca viên` : `${totalCount} ca viên`

export type Granularity = 'week' | 'month' | 'year'

export const granularityLabels: Record<Granularity, string> = { week: 'Tuần', month: 'Tháng', year: 'Năm' }

/** A reporting period: inclusive `YYYY-MM-DD` bounds, sent as `fromDate` / `toDate`. */
export interface Period {
  from: string
  to: string
}

/** Monday first, the Vietnamese calendar week. */
const mondayOf = (date: Dayjs) => date.subtract((date.day() + 6) % 7, 'day').startOf('day')
const iso = (date: Dayjs) => date.format('YYYY-MM-DD')

/** The week (Monday to Sunday), the month or the year holding `anchor`. */
export function periodOf(granularity: Granularity, anchor: Dayjs): Period {
  const start = granularity === 'week' ? mondayOf(anchor) : anchor.startOf(granularity)
  const end = granularity === 'week' ? start.add(6, 'day') : start.endOf(granularity)
  return { from: iso(start), to: iso(end) }
}
