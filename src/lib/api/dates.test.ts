import { describe, expect, it } from 'vitest'
import { parseUtc } from './dates'

describe('parseUtc', () => {
  it('reads a backend date without an offset as UTC', () => {
    expect(parseUtc('2026-10-02T08:00:00').toISOString()).toBe('2026-10-02T08:00:00.000Z')
    expect(parseUtc('2026-10-02T08:00:00.1234567').toISOString()).toBe('2026-10-02T08:00:00.123Z')
  })

  it('keeps an explicit offset', () => {
    expect(parseUtc('2026-10-02T08:00:00Z').toISOString()).toBe('2026-10-02T08:00:00.000Z')
    expect(parseUtc('2026-10-02T15:00:00+07:00').toISOString()).toBe('2026-10-02T08:00:00.000Z')
  })
})
