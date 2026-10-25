import type { Dayjs } from 'dayjs'

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
