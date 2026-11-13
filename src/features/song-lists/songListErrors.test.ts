import { describe, expect, it } from 'vitest'
import { hasActiveMemberFilters } from '@/features/members/memberFilters'
import { isStaleReview } from '@/features/skill-approval/skillReviewErrors'
import { hasActiveFilters } from '@/features/users/accountFilters'
import { ApiError } from '@/lib/api/errors'
import { songListErrorMessage } from './songListErrors'

describe('songListErrorMessage', () => {
  it('falls back for an unknown code and a non-API error', () => {
    expect(songListErrorMessage(new ApiError(400, { code: 'UNKNOWN', errors: { a: ['ALSO_UNKNOWN'] } }), 'fb')).toBe('fb')
    expect(songListErrorMessage(new Error('x'), 'fb')).toBe('fb')
  })

  it('maps the D8 lead-choir refusal', () => {
    expect(songListErrorMessage(new ApiError(403, { code: 'CHOIR_NOT_LEAD' }), 'fb')).not.toBe('fb')
  })
})

describe('isStaleReview', () => {
  it('is true only for a declaration gone or already decided', () => {
    expect(isStaleReview(new ApiError(409, { code: 'MEMBER_SKILL_ALREADY_REVIEWED' }))).toBe(true)
    expect(isStaleReview(new ApiError(409, { code: 'OTHER' }))).toBe(false)
    expect(isStaleReview(new Error('x'))).toBe(false)
  })
})

describe('active filter checks', () => {
  it('ignore a blank search', () => {
    expect(hasActiveMemberFilters({ search: '  ' })).toBe(false)
    expect(hasActiveMemberFilters({ search: '', skillId: 'k1' })).toBe(true)
    expect(hasActiveFilters({ search: '  ' })).toBe(false)
    expect(hasActiveFilters({ search: '', isActive: false })).toBe(true)
  })
})
