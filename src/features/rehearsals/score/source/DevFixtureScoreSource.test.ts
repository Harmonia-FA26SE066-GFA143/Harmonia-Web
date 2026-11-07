import { afterEach, describe, expect, it, vi } from 'vitest'
import { ScoreSourceError } from './types'

const flags = vi.hoisted(() => ({ useDevFixtures: false }))
vi.mock('@/config/env', () => ({
  env: {
    get useDevFixtures() {
      return flags.useDevFixtures
    },
  },
}))

const { DevFixtureScoreSource } = await import('./DevFixtureScoreSource')

afterEach(() => {
  flags.useDevFixtures = false
  vi.unstubAllGlobals()
})

describe('DevFixtureScoreSource', () => {
  it('is unavailable when dev fixtures are off and loads nothing', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)

    const error = await new DevFixtureScoreSource().load().then(
      () => undefined,
      (reason: unknown) => reason,
    )

    expect(error).toBeInstanceOf(ScoreSourceError)
    expect((error as ScoreSourceError).code).toBe('unavailable')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('loads the bundled sample as mxl bytes plus the wav URL when enabled', async () => {
    flags.useDevFixtures = true
    const fetch = vi.fn(async () => new Response(new Uint8Array([0x50, 0x4b])))
    vi.stubGlobal('fetch', fetch)

    const pkg = await new DevFixtureScoreSource().load()

    expect(pkg.score.format).toBe('mxl')
    expect(pkg.score.fileName).toBe('sample.mxl')
    expect(Array.from(pkg.score.data as Uint8Array)).toEqual([0x50, 0x4b])
    expect(pkg.audioUrl).toMatch(/sample\.wav/)
    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/sample\.mxl/), expect.anything())
    expect(() => {
      pkg.dispose()
      pkg.dispose()
    }).not.toThrow()
  })

  it('an already aborted signal rejects with aborted', async () => {
    flags.useDevFixtures = true
    vi.stubGlobal('fetch', vi.fn())
    const controller = new AbortController()
    controller.abort()

    const error = await new DevFixtureScoreSource().load(controller.signal).then(
      () => undefined,
      (reason: unknown) => reason,
    )
    expect((error as ScoreSourceError).code).toBe('aborted')
  })
})
