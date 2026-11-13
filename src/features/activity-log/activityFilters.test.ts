import { afterEach, describe, expect, it, vi } from 'vitest'
import { actorName, readActivityState, toActivityQuery, writeActivityState } from './activityFilters'
import type { ActivityRecord } from './types'

afterEach(() => {
  vi.useRealTimers()
})

describe('toActivityQuery', () => {
  it('counts whole days in Vietnam, today included', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    // 18:00 UTC on 12/11 is already 13/11 in Vietnam.
    vi.setSystemTime(new Date('2026-11-12T18:00:00Z'))
    expect(toActivityQuery({ period: 'today' }).fromDate).toBe('2026-11-13')
    expect(toActivityQuery({ period: 'last7Days' }).fromDate).toBe('2026-11-07')
    expect(toActivityQuery({ period: 'last30Days' }).fromDate).toBe('2026-10-15')
  })

  it('sends the picked user id and leaves unset filters out', () => {
    expect(toActivityQuery({ action: 'Created', user: { id: 'u1', name: 'An' } })).toEqual({
      entityType: undefined,
      action: 'Created',
      fromDate: undefined,
      userId: 'u1',
    })
  })
})

describe('activity list state in the URL', () => {
  it('round-trips the filters and page', () => {
    const filters = { entityType: 'User', action: 'Deleted', period: 'last7Days' as const, user: { id: 'u1', name: 'Giuse An' } }
    const params = writeActivityState(filters, 3)
    expect(readActivityState(params)).toEqual({ filters, page: 3 })
  })

  it('ignores unknown values and a bad page', () => {
    const state = readActivityState(new URLSearchParams('entityType=Hack&action=Drop&period=forever&page=-4'))
    expect(state).toEqual({ filters: { entityType: undefined, action: undefined, period: undefined, user: undefined }, page: 1 })
    expect(readActivityState(new URLSearchParams('userId=u1')).filters.user).toEqual({ id: 'u1', name: 'Người dùng' })
  })

  it('writes nothing for the default state', () => {
    expect(writeActivityState({}, 1).toString()).toBe('')
  })
})

describe('actorName', () => {
  const record = (user?: ActivityRecord['user']): ActivityRecord => ({ id: '1', createdAt: '', action: 'Created', entityType: 'User', user })

  it('prefers the name, then the email, then a generic word', () => {
    expect(actorName(record({ id: 'u', fullName: 'An', email: 'a@x.vn' }))).toBe('An')
    expect(actorName(record({ id: 'u', fullName: '', email: 'a@x.vn' }))).toBe('a@x.vn')
    expect(actorName(record({ id: 'u' }))).toBe('Người dùng')
    expect(actorName(record())).toBe('Không đăng nhập')
  })
})
