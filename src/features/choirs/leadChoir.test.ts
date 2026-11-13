import { describe, expect, it } from 'vitest'
import { ApiError } from '@/lib/api/errors'
import { choirErrorMessage } from './choirErrors'
import { isPlanningDirector } from './leadChoir'
import type { EventChoir } from './types'

const choir = (patch: Partial<EventChoir>): EventChoir => ({ choirId: 'c1', name: 'Ca đoàn Cecilia', isActive: true, isLead: false, ...patch })

describe('isPlanningDirector', () => {
  it('lets anyone plan while no lead choir is chosen', () => {
    expect(isPlanningDirector([], 'u1')).toBe(true)
    expect(isPlanningDirector([choir({ directorId: 'u2' })], 'u1')).toBe(true)
  })

  it('lets only the lead choir’s director or substitute plan', () => {
    const lead = choir({ isLead: true, directorId: 'u2', substituteDirectorId: 'u3' })
    expect(isPlanningDirector([lead], 'u2')).toBe(true)
    expect(isPlanningDirector([lead], 'u3')).toBe(true)
    expect(isPlanningDirector([lead, choir({ choirId: 'c2', directorId: 'u1' })], 'u1')).toBe(false)
  })
})

describe('choirErrorMessage', () => {
  it('uses the code, then the first known field error, then the fallback', () => {
    expect(choirErrorMessage(new ApiError(409, { code: 'CHOIR_NAME_ALREADY_EXISTS' }), 'fb')).toBe('Đã có ca đoàn trùng tên.')
    expect(
      choirErrorMessage(new ApiError(400, { code: 'VALIDATION_FAILED', errors: { reason: ['CHOIR_CHANGE_REASON_REQUIRED'] } }), 'fb'),
    ).toBe('Vui lòng nhập lý do thay đổi.')
    expect(choirErrorMessage(new ApiError(400, { code: 'VALIDATION_FAILED', errors: { x: ['UNKNOWN'] } }), 'fb')).toBe('fb')
  })
})
