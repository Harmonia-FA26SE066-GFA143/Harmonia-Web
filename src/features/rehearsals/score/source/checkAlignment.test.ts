import { describe, expect, it } from 'vitest'
import { checkAlignment } from './checkAlignment'

describe('checkAlignment', () => {
  it('accepts a difference within the tolerance, in either direction', () => {
    expect(checkAlignment(10.66, 10.5)).toEqual({ ok: true, deltaSeconds: expect.closeTo(0.16, 6) })
    expect(checkAlignment(10.5, 10.66)).toEqual({ ok: true, deltaSeconds: expect.closeTo(-0.16, 6) })
  })

  it('rejects a difference over the tolerance', () => {
    expect(checkAlignment(12.66, 10.66)).toEqual({ ok: false, deltaSeconds: expect.closeTo(2, 6) })
    expect(checkAlignment(10, 11)).toEqual({ ok: false, deltaSeconds: -1 })
  })

  it('accepts exactly the tolerance and honours a custom one', () => {
    expect(checkAlignment(10.5, 10)).toEqual({ ok: true, deltaSeconds: 0.5 })
    expect(checkAlignment(10.5001, 10).ok).toBe(false)
    expect(checkAlignment(12, 10, 2).ok).toBe(true)
  })

  it.each([
    [-1, 10, 0.5],
    [10, -1, 0.5],
    [10, 10, -0.5],
    [Number.NaN, 10, 0.5],
    [10, Number.NaN, 0.5],
    [10, 10, Number.NaN],
    [Number.POSITIVE_INFINITY, 10, 0.5],
  ])('is never ok for invalid input (%s, %s, %s)', (audio, timeline, tolerance) => {
    expect(checkAlignment(audio, timeline, tolerance).ok).toBe(false)
  })
})
