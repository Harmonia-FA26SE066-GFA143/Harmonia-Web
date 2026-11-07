import { describe, expect, it } from 'vitest'
import { chooseOccurrence } from './occurrence'

describe('chooseOccurrence', () => {
  it('picks first onset at or after currentTime minus 100ms', () => {
    const onsets = [1, 5, 9]
    expect(chooseOccurrence(onsets, 4.95)).toBe(5)
    expect(chooseOccurrence(onsets, 5.05)).toBe(5)
    expect(chooseOccurrence(onsets, 5.2)).toBe(9)
  })

  it('wraps to first when past last', () => {
    expect(chooseOccurrence([1, 5, 9], 9.5)).toBe(1)
  })

  it('returns undefined for empty', () => {
    expect(chooseOccurrence([], 3)).toBeUndefined()
  })

  it('single onset always returned', () => {
    expect(chooseOccurrence([4], 0)).toBe(4)
    expect(chooseOccurrence([4], 100)).toBe(4)
  })
})
