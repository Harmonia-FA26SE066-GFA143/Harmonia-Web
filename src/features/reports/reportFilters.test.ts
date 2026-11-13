import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import { periodOf } from './directorReport'
import { readReportFilters, toReportQuery, writeReportParams } from './reportFilters'

describe('report filters in the URL', () => {
  it('round-trips the kind and filters', () => {
    const params = writeReportParams('attendance', { month: '2026-02', seasonId: 's1', choirId: undefined })
    expect(params.toString()).toBe('kind=attendance&month=2026-02&seasonId=s1')
    expect(readReportFilters(params)).toEqual({ month: '2026-02', seasonId: 's1', choirId: undefined })
  })

  it('ignores a malformed month', () => {
    expect(readReportFilters(new URLSearchParams('month=2026-13')).month).toBeUndefined()
    expect(readReportFilters(new URLSearchParams('month=2026-1')).month).toBeUndefined()
  })
})

describe('toReportQuery', () => {
  it('turns a month into its first and last day, leap years included', () => {
    expect(toReportQuery({ month: '2028-02' })).toMatchObject({ fromDate: '2028-02-01', toDate: '2028-02-29' })
  })

  it('prefers explicit bounds over the month', () => {
    expect(toReportQuery({ month: '2026-02', fromDate: '2026-02-09', toDate: '2026-02-15', seasonId: 's1' })).toEqual({
      liturgicalSeasonId: 's1',
      fromDate: '2026-02-09',
      toDate: '2026-02-15',
      choirId: undefined,
    })
  })
})

describe('periodOf', () => {
  it('runs a week from Monday to Sunday, a Sunday included', () => {
    expect(periodOf('week', dayjs('2026-11-12'))).toEqual({ from: '2026-11-09', to: '2026-11-15' })
    expect(periodOf('week', dayjs('2026-11-15'))).toEqual({ from: '2026-11-09', to: '2026-11-15' })
    expect(periodOf('week', dayjs('2026-12-30'))).toEqual({ from: '2026-12-28', to: '2027-01-03' })
  })

  it('covers the whole month or year', () => {
    expect(periodOf('month', dayjs('2026-11-12'))).toEqual({ from: '2026-11-01', to: '2026-11-30' })
    expect(periodOf('year', dayjs('2026-11-12'))).toEqual({ from: '2026-01-01', to: '2026-12-31' })
  })
})
