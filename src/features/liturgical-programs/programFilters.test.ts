import { describe, expect, it } from 'vitest'
import { massTimeOf } from './massTime'
import { readEventListState, writeEventListState } from './programFilters'

describe('event list state in the URL', () => {
  it('round-trips the filters and page', () => {
    const filters = { status: 'published' as const, fromDate: '2026-11-01', toDate: '2026-11-30' }
    expect(readEventListState(writeEventListState(filters, 2))).toEqual({ filters, page: 2 })
  })

  it('ignores an unknown status, malformed dates and a bad page', () => {
    expect(readEventListState(new URLSearchParams('status=deleted&fromDate=12/11/2026&toDate=2026-1-1&page=abc'))).toEqual({
      filters: { status: undefined, fromDate: undefined, toDate: undefined },
      page: 1,
    })
  })
})

describe('massTimeOf', () => {
  it('puts the 11:00 and 17:00 boundaries in the later band', () => {
    expect(massTimeOf('05:30')).toBe('morning')
    expect(massTimeOf('10:59')).toBe('morning')
    expect(massTimeOf('11:00')).toBe('afternoon')
    expect(massTimeOf('16:59')).toBe('afternoon')
    expect(massTimeOf('17:00')).toBe('evening')
  })

  it('has no band without a readable time', () => {
    expect(massTimeOf(undefined)).toBeUndefined()
    expect(massTimeOf('')).toBeUndefined()
    expect(massTimeOf('xx:00')).toBeUndefined()
  })
})
