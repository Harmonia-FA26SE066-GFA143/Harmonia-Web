import { describe, expect, it, vi } from 'vitest'
import {
  createPracticeScoreCache,
  estimatedPreparedBytes,
  MAX_IDLE_BYTES,
  MAX_IDLE_SCORES,
  type PreparedScore,
} from './practiceScoreCache'

function fakePrepared(estimatedBytes = 1024): PreparedScore {
  return {
    package: {
      score: { format: 'mxl', data: new Uint8Array([1, 2]), fileName: 'sample.mxl' },
      audioUrl: 'blob:audio',
      estimatedBytes,
      dispose: vi.fn(),
    },
    engine: {
      load: vi.fn(),
      relayout: vi.fn(),
      dispose: vi.fn(),
    },
    fileName: 'sample.mxl',
    svgPages: ['<svg/>'],
    timeline: { events: [], onsets: new Map(), duration: 10 },
    lyrics: null,
    staves: 1,
    pageWidth: 1200,
    zoom: 1,
    multiStaff: false,
    estimatedBytes,
  }
}

describe('createPracticeScoreCache', () => {
  it('returns a cached score once without disposing it, and misses afterwards until put back', () => {
    const cache = createPracticeScoreCache()
    const score = fakePrepared()

    cache.put('s1:m1:1', 's1:m1', score)
    expect(cache.take('s1:m1:1', 's1:m1')).toBe(score)
    expect(score.engine.dispose).not.toHaveBeenCalled()
    expect(score.package.dispose).not.toHaveBeenCalled()
    expect(cache.take('s1:m1:1', 's1:m1')).toBeUndefined()
  })

  it('keeps at most MAX_IDLE_SCORES idle entries and disposes the least recently stored one', async () => {
    const cache = createPracticeScoreCache()
    const items = Array.from({ length: MAX_IDLE_SCORES + 1 }, () => fakePrepared())

    items.forEach((item, index) => cache.put(`s${index}:m:1`, `s${index}:m`, item))
    await Promise.resolve()

    expect(items[0].engine.dispose).toHaveBeenCalledTimes(1)
    expect(items[0].package.dispose).toHaveBeenCalledTimes(1)
    expect(cache.take('s0:m:1')).toBeUndefined()
    for (let index = 1; index <= MAX_IDLE_SCORES; index += 1) {
      expect(cache.take(`s${index}:m:1`)).toBe(items[index])
    }
  })

  it('evicts oldest entries when the byte ceiling is exceeded', async () => {
    const cache = createPracticeScoreCache()
    const half = Math.floor(MAX_IDLE_BYTES * 0.6)
    const first = fakePrepared(half)
    const second = fakePrepared(half)

    cache.put('s1:m:1', 's1:m', first)
    cache.put('s2:m:1', 's2:m', second)
    await Promise.resolve()

    expect(first.engine.dispose).toHaveBeenCalledTimes(1)
    expect(first.package.dispose).toHaveBeenCalledTimes(1)
    expect(cache.take('s1:m:1')).toBeUndefined()
    expect(cache.take('s2:m:1')).toBe(second)
  })

  it('replaces and disposes an older revision of the same identity on put or take', () => {
    const cache = createPracticeScoreCache()
    const rev1 = fakePrepared()
    const rev2 = fakePrepared()

    cache.put('s1:m1:1', 's1:m1', rev1)
    expect(cache.take('s1:m1:2', 's1:m1')).toBeUndefined()
    expect(rev1.engine.dispose).toHaveBeenCalledTimes(1)
    expect(rev1.package.dispose).toHaveBeenCalledTimes(1)

    const rev2Again = fakePrepared()
    const rev3 = fakePrepared()
    cache.put('s1:m1:2', 's1:m1', rev2)
    cache.put('s1:m1:3', 's1:m1', rev3)
    expect(rev2.engine.dispose).toHaveBeenCalledTimes(1)
    expect(cache.take('s1:m1:3', 's1:m1')).toBe(rev3)
    expect(rev2Again.engine.dispose).not.toHaveBeenCalled()
  })

  it('disposes all entries on close, disposes late puts while closed, and caches again after open', () => {
    const cache = createPracticeScoreCache()
    const stored = fakePrepared()
    const late = fakePrepared()
    const reopened = fakePrepared()

    cache.put('s1:m:1', 's1:m', stored)
    cache.close()
    expect(stored.engine.dispose).toHaveBeenCalledTimes(1)
    expect(stored.package.dispose).toHaveBeenCalledTimes(1)

    cache.put('s2:m:1', 's2:m', late)
    expect(late.engine.dispose).toHaveBeenCalledTimes(1)
    expect(late.package.dispose).toHaveBeenCalledTimes(1)
    expect(cache.take('s2:m:1')).toBeUndefined()

    cache.open()
    cache.put('s3:m:1', 's3:m', reopened)
    expect(cache.take('s3:m:1')).toBe(reopened)
  })

  it('estimates bytes from package bytes, rendered SVG strings and timeline events', () => {
    const pack = {
      score: { format: 'musicxml' as const, data: '<score/>', fileName: 'a.musicxml' },
      audioUrl: 'blob:audio',
      estimatedBytes: 1000,
      dispose: vi.fn(),
    }
    const timeline = {
      events: [{ time: 0, noteId: 'n1', elementId: 'n1', type: 'on' as const, isTieContinuation: false, finalOff: 1 }],
      onsets: new Map([['n1', [0]]]),
      duration: 4,
    }
    expect(estimatedPreparedBytes(pack, ['<svg/>'], timeline)).toBe(1000 + '<svg/>'.length * 2 + 64 + 32)
  })
})
