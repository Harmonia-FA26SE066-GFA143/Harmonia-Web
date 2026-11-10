import { describe, expect, it } from 'vitest'
import { nearestOccurrence } from './nearestOccurrence'

describe('nearestOccurrence', () => {
  it('picks the onset closest to the current time', () => {
    expect(nearestOccurrence([10, 30], 12)).toBe(10)
    expect(nearestOccurrence([10, 30], 25)).toBe(30)
    expect(nearestOccurrence([10, 30], 3)).toBe(10)
    expect(nearestOccurrence([10, 30], 99)).toBe(30)
  })

  it('takes the earlier onset on a tie, so the passage plays again', () => {
    expect(nearestOccurrence([10, 30], 20)).toBe(10)
    expect(nearestOccurrence([0, 5.5, 11], 8.25)).toBe(5.5)
  })

  it('looks at both sides of the current time with three repeats', () => {
    const onsets = [4, 20, 36]
    expect(nearestOccurrence(onsets, 0)).toBe(4)
    expect(nearestOccurrence(onsets, 11)).toBe(4)
    expect(nearestOccurrence(onsets, 13)).toBe(20)
    expect(nearestOccurrence(onsets, 27)).toBe(20)
    expect(nearestOccurrence(onsets, 29)).toBe(36)
  })

  it('returns the only onset whatever the time, and nothing for none', () => {
    expect(nearestOccurrence([4], 0)).toBe(4)
    expect(nearestOccurrence([4], 100)).toBe(4)
    expect(nearestOccurrence([], 3)).toBeUndefined()
  })

  it('does not depend on the order of the list', () => {
    expect(nearestOccurrence([30, 10], 20)).toBe(10)
    expect(nearestOccurrence([30, 10], 25)).toBe(30)
  })
})
