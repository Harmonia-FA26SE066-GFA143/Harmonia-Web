import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  MIN_ENGINE_PAGE_WIDTH,
  MULTI_STAFF_MIN_ENGINE_PAGE_WIDTH,
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

describe('toEnginePageWidth by staff count (P10-A)', () => {
  // every width the single-staff tests above use, and the bad ones
  const WIDTHS = [Number.NaN, -500, 0, 1, 222, 285, 299, 300, 305, 321, 327, 340, 650, 656, 703, 1000, 1054, 1100]

  it('one staff, or a count under two, keeps every value of the single-staff rule', () => {
    for (const width of WIDTHS) {
      expect(toEnginePageWidth(width, 1)).toBe(toEnginePageWidth(width))
      expect(toEnginePageWidth(width, 0)).toBe(toEnginePageWidth(width))
    }
  })

  it('two staves or more: never under the multi-staff floor, and SCORE_LAYOUT_SCALE times the width above it', () => {
    for (const staves of [2, 4, 12]) {
      for (const width of WIDTHS) {
        const expected = Number.isFinite(width) && width > 0 ? Math.max(MULTI_STAFF_MIN_ENGINE_PAGE_WIDTH, Math.round(width * SCORE_LAYOUT_SCALE)) : MULTI_STAFF_MIN_ENGINE_PAGE_WIDTH
        expect(toEnginePageWidth(width, staves)).toBe(expected)
      }
    }
    expect(MULTI_STAFF_MIN_ENGINE_PAGE_WIDTH).toBeGreaterThan(toEnginePageWidth(327)) // the 768 px sheet that squeezed a SATB
  })

  it('two staves or more: continuous and never decreasing as the sheet widens (no step)', () => {
    let previous = toEnginePageWidth(1, 4)
    for (let width = 2; width <= 1600; width += 1) {
      const next = toEnginePageWidth(width, 4)
      expect(next).toBeGreaterThanOrEqual(previous)
      expect(next - previous).toBeLessThanOrEqual(2) // 1.3 px of page per px of sheet, rounded
      previous = next
    }
  })

  it('the floor is the measured 900, and the 1440 px sheets keep their page; the 768 px focus sheet now gets the floor', () => {
    expect(MULTI_STAFF_MIN_ENGINE_PAGE_WIDTH).toBe(900) // P10-A: 850 still let syllables touch on a dense 4-part score
    expect(toEnginePageWidth(656, 4)).toBe(900) // was 853 (1.3 x 656), under the floor
    expect(toEnginePageWidth(703, 4)).toBe(914)
    expect(toEnginePageWidth(1054, 4)).toBe(1370)
  })

  it('the stylesheet keeps a multi-staff page at least floor / scale px wide, so a narrower sheet scrolls it', () => {
    const css = readFileSync(join(process.cwd(), 'src/features/rehearsals/score/viewer/ScoreViewer.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    expect(Number(css.match(/--hm-multi-staff-page-units\s*:\s*([\d.]+)/)![1])).toBe(MULTI_STAFF_MIN_ENGINE_PAGE_WIDTH)
    expect(css).toMatch(
      /\.hm-score-frame--multi-staff \.hm-score-page svg\s*\{[^}]*min-width\s*:\s*calc\(var\(--hm-multi-staff-page-units\)\s*\/\s*var\(--hm-layout-scale\)\s*\*\s*1px\)/,
    )
  })
})
