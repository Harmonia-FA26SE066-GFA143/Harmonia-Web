import { describe, expect, it } from 'vitest'
import { MIN_ENGINE_PAGE_WIDTH, SCORE_LAYOUT_SCALE, toEnginePageWidth } from './toEnginePageWidth'

describe('toEnginePageWidth', () => {
  it('scales the content width by SCORE_LAYOUT_SCALE', () => {
    expect(SCORE_LAYOUT_SCALE).toBe(1.3)
    expect(toEnginePageWidth(1000)).toBe(1300)
    expect(toEnginePageWidth(1034)).toBe(1344)
  })

  it('rounds to a whole number', () => {
    expect(toEnginePageWidth(1035)).toBe(1346) // 1345.5
    expect(toEnginePageWidth(1001)).toBe(1301) // 1301.3
    expect(Number.isInteger(toEnginePageWidth(777.7))).toBe(true)
  })

  it('never goes below the minimum', () => {
    expect(toEnginePageWidth(10)).toBe(MIN_ENGINE_PAGE_WIDTH)
    expect(toEnginePageWidth(0)).toBe(MIN_ENGINE_PAGE_WIDTH)
  })

  it('NaN, infinite or negative widths give the minimum', () => {
    expect(toEnginePageWidth(Number.NaN)).toBe(MIN_ENGINE_PAGE_WIDTH)
    expect(toEnginePageWidth(-500)).toBe(MIN_ENGINE_PAGE_WIDTH)
    expect(toEnginePageWidth(Number.POSITIVE_INFINITY)).toBe(MIN_ENGINE_PAGE_WIDTH)
  })
})
