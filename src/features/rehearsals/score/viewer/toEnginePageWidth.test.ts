import { describe, expect, it } from 'vitest'
import {
  MIN_ENGINE_PAGE_WIDTH,
  NARROW_CONTENT_PX,
  PHONE_ENGINE_PAGE_WIDTH,
  SCORE_LAYOUT_SCALE,
  toEnginePageWidth,
} from './toEnginePageWidth'

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

  it('gives the widths of the four sheets the product meets: phone in focus mode, the narrowest wide layout, a tablet, a desktop', () => {
    expect(toEnginePageWidth(285)).toBe(PHONE_ENGINE_PAGE_WIDTH) // 375 px phone, focus mode (351 - 66)
    expect(toEnginePageWidth(340)).toBe(442) // 1.3 x 340
    expect(toEnginePageWidth(650)).toBe(845)
    expect(toEnginePageWidth(1100)).toBe(1430)
  })

  it('a sheet narrower than the threshold gets a readable page that the viewer scrolls, not a squeezed one', () => {
    expect(toEnginePageWidth(NARROW_CONTENT_PX - 1)).toBe(PHONE_ENGINE_PAGE_WIDTH)
    expect(toEnginePageWidth(222)).toBe(PHONE_ENGINE_PAGE_WIDTH) // 375 px phone, normal mode (288 - 66)
    expect(toEnginePageWidth(1)).toBe(PHONE_ENGINE_PAGE_WIDTH)
    // a page that is not wider than the sheet would not scroll, and would be squeezed again
    expect(PHONE_ENGINE_PAGE_WIDTH).toBeGreaterThan(SCORE_LAYOUT_SCALE * NARROW_CONTENT_PX)
  })

  it('from the threshold up the page follows the sheet, and never goes below the minimum', () => {
    expect(toEnginePageWidth(NARROW_CONTENT_PX)).toBe(Math.max(MIN_ENGINE_PAGE_WIDTH, Math.round(SCORE_LAYOUT_SCALE * NARROW_CONTENT_PX)))
    expect(toEnginePageWidth(NARROW_CONTENT_PX)).toBeLessThan(PHONE_ENGINE_PAGE_WIDTH)
    expect(toEnginePageWidth(305)).toBe(MIN_ENGINE_PAGE_WIDTH) // 396.5 rounds up to 397, under the minimum
    expect(toEnginePageWidth(327)).toBe(425) // the narrowest sheet of a 768 px window, as before
  })

  it('does not scroll at 768 px: the narrowest sheet of a window that wide is at or above the threshold', () => {
    // measured P7 fix 2: 768 px window, normal mode, sheet 393 px wide (content 327)
    expect(327).toBeGreaterThanOrEqual(NARROW_CONTENT_PX)
  })

  it('NaN, infinite, zero or negative widths give the minimum (the viewer never reports them)', () => {
    expect(toEnginePageWidth(Number.NaN)).toBe(MIN_ENGINE_PAGE_WIDTH)
    expect(toEnginePageWidth(Number.POSITIVE_INFINITY)).toBe(MIN_ENGINE_PAGE_WIDTH)
    expect(toEnginePageWidth(0)).toBe(MIN_ENGINE_PAGE_WIDTH)
    expect(toEnginePageWidth(-500)).toBe(MIN_ENGINE_PAGE_WIDTH)
  })
})
