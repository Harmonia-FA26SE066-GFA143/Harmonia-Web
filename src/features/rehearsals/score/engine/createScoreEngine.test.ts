import { describe, expect, it, vi } from 'vitest'
import { ALIAS_BATCH_SIZE, createScoreEngine } from './createScoreEngine'
import { ScoreEngineError, type ScoreToolkit } from './types'

const TIMEMAP = [
  { tstamp: 0, on: ['n1'] },
  { tstamp: 667, off: ['n1'] },
]

function fakeToolkit(overrides: Partial<ScoreToolkit> = {}) {
  let width = 0
  const toolkit = {
    setOptions: vi.fn((options: { pageWidth: number }) => {
      width = options.pageWidth
      return true
    }),
    loadData: vi.fn((data: string) => data.startsWith('<')),
    loadZipDataBuffer: vi.fn((data: ArrayBuffer) => data.byteLength > 0),
    getPageCount: vi.fn(() => 2),
    renderToSVG: vi.fn((page: number) => `<svg data-page="${page}" data-width="${width}"/>`),
    renderToTimemap: vi.fn(() => TIMEMAP),
    getMEI: vi.fn(() => '<mei/>'),
    getExpansionIdsForElement: vi.fn((id: string) => [id]),
    redoLayout: vi.fn(),
    destroy: vi.fn(),
  }
  return Object.assign(toolkit, overrides)
}

const SCORE = { format: 'musicxml', data: '<score/>' } as const
const LAYOUT = { pageWidth: 1800 }

/** A toolkit whose first page draws `rendered` and whose timemap plays `first`, then `second`. */
function aliasToolkit(rendered: string[], [first, second]: string[][], expansion: Record<string, unknown>) {
  return fakeToolkit({
    renderToSVG: vi.fn((page: number) => (page === 1 ? `<svg>${rendered.map((id) => `<g id="${id}" class="note"/>`).join('')}</svg>` : '<svg/>')),
    renderToTimemap: vi.fn(() => [
      { tstamp: 0, on: first },
      { tstamp: 500, off: first, on: second },
      { tstamp: 1000, off: second },
    ]),
    getExpansionIdsForElement: vi.fn((id: string): unknown => expansion[id] ?? []),
  })
}

async function rejection(promise: Promise<unknown>): Promise<ScoreEngineError> {
  const error = await promise.then(
    () => undefined,
    (reason: unknown) => reason,
  )
  expect(error).toBeInstanceOf(ScoreEngineError)
  return error as ScoreEngineError
}

describe('createScoreEngine', () => {
  it('load returns svg pages, mei and the raw timemap from one load', async () => {
    const toolkit = fakeToolkit()
    const engine = createScoreEngine(toolkit)

    const result = await engine.load({ format: 'musicxml', data: '<score/>' }, { pageWidth: 1800 })

    expect(result).toEqual({
      svgPages: ['<svg data-page="1" data-width="1800"/>', '<svg data-page="2" data-width="1800"/>'],
      mei: '<mei/>',
      timemap: TIMEMAP,
      aliases: new Map(),
    })
    expect(toolkit.renderToTimemap).toHaveBeenCalledWith({ includeMeasures: true })
  })

  it('load maps a repeated id to its original and never asks about an id the SVG already has', async () => {
    const toolkit = aliasToolkit(['a', 'b'], [['a', 'b'], ['a-rend2']], { 'a-rend2': ['a', 'a-rend2'] })

    const { aliases } = await createScoreEngine(toolkit).load(SCORE, LAYOUT)

    expect([...aliases]).toEqual([['a-rend2', 'a']])
    expect(toolkit.getExpansionIdsForElement.mock.calls).toEqual([['a-rend2']])
  })

  it('an expansion answer that does not hold up is skipped and the load still succeeds', async () => {
    const toolkit = aliasToolkit(
      ['a', 'b'],
      [['a', 'b'], ['a-rend2', 'p', 'q', 'c', 'd', 'e', 'f', 'g']],
      {
        'a-rend2': ['a', 'a-rend2'], // valid
        p: ['missing'], // does not name the id asked about
        q: ['a'], // names a drawn note, but not the id asked about
        c: ['d', 'c'], // c and d point at each other, neither is drawn
        d: ['c', 'd'],
        e: ['zz', 'e'], // original not in the SVG
        f: ['a', 1, 'f'], // not all strings
        g: { 0: 'a' }, // not an array
      },
    )

    const { aliases } = await createScoreEngine(toolkit).load(SCORE, LAYOUT)

    expect([...aliases]).toEqual([['a-rend2', 'a']])
  })

  it('looks ids up in batches and yields to the browser between them', async () => {
    const missing = Array.from({ length: 2 * ALIAS_BATCH_SIZE + 1 }, (_, index) => `a-rend${index + 2}`)
    const toolkit = aliasToolkit(['a'], [['a'], missing], Object.fromEntries(missing.map((id) => [id, ['a', id]])))
    const lookupsAtYield: number[] = []
    const engine = createScoreEngine(toolkit, async () => {
      lookupsAtYield.push(toolkit.getExpansionIdsForElement.mock.calls.length)
    })

    const { aliases } = await engine.load(SCORE, LAYOUT)

    expect(aliases.size).toBe(missing.length)
    expect(lookupsAtYield).toEqual([ALIAS_BATCH_SIZE, 2 * ALIAS_BATCH_SIZE])
  })

  it.each([
    ['dispose', 'disposed'],
    ['a newer load', 'superseded'],
  ] as const)('%s between two batches stops the lookups and the old load gives no aliases', async (what, code) => {
    const missing = Array.from({ length: ALIAS_BATCH_SIZE + 1 }, (_, index) => `a-rend${index + 2}`)
    const toolkit = aliasToolkit(['a'], [['a'], missing], Object.fromEntries(missing.map((id) => [id, ['a', id]])))
    let release: () => void = () => {}
    let paused: () => void = () => {}
    const atPause = new Promise<void>((resolve) => (paused = resolve))
    let pauses = 0
    // Only the first pause is held; the newer load's pauses pass straight through.
    const engine = createScoreEngine(toolkit, () => {
      pauses += 1
      if (pauses > 1) return Promise.resolve()
      paused()
      return new Promise<void>((resolve) => (release = resolve))
    })

    const first = engine.load(SCORE, LAYOUT)
    await atPause
    const lookupsBefore = toolkit.getExpansionIdsForElement.mock.calls.length
    const next = what === 'dispose' ? (engine.dispose(), undefined) : engine.load(SCORE, LAYOUT)
    release()

    expect((await rejection(first)).code).toBe(code)
    if (what === 'dispose') expect(toolkit.getExpansionIdsForElement.mock.calls.length).toBe(lookupsBefore)
    else expect((await next)?.aliases.size).toBe(missing.length)
  })

  it('load and relayout ask for pages only as tall as their content (adjustPageHeight)', async () => {
    const toolkit = fakeToolkit()
    const engine = createScoreEngine(toolkit)

    await engine.load({ format: 'musicxml', data: '<score/>' }, { pageWidth: 1800 })
    engine.relayout(1200)

    expect(toolkit.setOptions.mock.calls).toEqual([
      [{ pageWidth: 1800, adjustPageHeight: true }],
      [{ pageWidth: 1200, adjustPageHeight: true }],
    ])
  })

  it('broken data rejects with load-failed, never the raw library error', async () => {
    const raw = new Error('vrv internal: pugixml parse error')
    const engine = createScoreEngine(
      fakeToolkit({
        loadData: vi.fn(() => {
          throw raw
        }),
      }),
    )

    const error = await rejection(engine.load({ format: 'musicxml', data: 'garbage' }, { pageWidth: 1800 }))
    expect(error.code).toBe('load-failed')
    expect(error.message).not.toContain('pugixml')
    expect(error.cause).toBe(raw)
  })

  it('loadData returning false rejects with load-failed and leaves nothing to relayout', async () => {
    const engine = createScoreEngine(fakeToolkit())

    expect((await rejection(engine.load({ format: 'musicxml', data: 'not xml' }, { pageWidth: 1800 }))).code).toBe(
      'load-failed',
    )
    expect(() => engine.relayout(1200)).toThrow(expect.objectContaining({ code: 'not-loaded' }))
  })

  it('after dispose, load rejects with disposed; dispose twice is safe and destroys once', async () => {
    const toolkit = fakeToolkit()
    const engine = createScoreEngine(toolkit)

    engine.dispose()
    engine.dispose()

    expect((await rejection(engine.load({ format: 'musicxml', data: '<score/>' }, { pageWidth: 1800 }))).code).toBe(
      'disposed',
    )
    expect(() => engine.relayout(1200)).toThrow(expect.objectContaining({ code: 'disposed' }))
    expect(toolkit.destroy).toHaveBeenCalledTimes(1)
    expect(toolkit.loadData).not.toHaveBeenCalled()
  })

  it('dispose while a load is pending rejects that load with disposed', async () => {
    const toolkit = fakeToolkit()
    const engine = createScoreEngine(toolkit)

    const pending = engine.load({ format: 'musicxml', data: '<score/>' }, { pageWidth: 1800 })
    engine.dispose()

    expect((await rejection(pending)).code).toBe('disposed')
    expect(toolkit.loadData).not.toHaveBeenCalled()
  })

  it('dispose destroys once and never throws even when destroy() throws; load then rejects with disposed', async () => {
    const toolkit = fakeToolkit({
      destroy: vi.fn(() => {
        throw new Error('destroy failed')
      }),
    })
    const engine = createScoreEngine(toolkit)

    expect(() => engine.dispose()).not.toThrow()
    expect(() => engine.dispose()).not.toThrow()

    expect(toolkit.destroy).toHaveBeenCalledTimes(1)
    expect((await rejection(engine.load({ format: 'musicxml', data: '<score/>' }, { pageWidth: 1800 }))).code).toBe(
      'disposed',
    )
  })

  it('setOptions returning false rejects load with load-failed before parsing', async () => {
    const toolkit = fakeToolkit({ setOptions: vi.fn(() => false) })
    const engine = createScoreEngine(toolkit)

    expect((await rejection(engine.load({ format: 'musicxml', data: '<score/>' }, { pageWidth: 1800 }))).code).toBe(
      'load-failed',
    )
    expect(toolkit.loadData).not.toHaveBeenCalled()
    expect(() => engine.relayout(900)).toThrow(expect.objectContaining({ code: 'not-loaded' }))
  })

  it('setOptions returning false makes relayout throw render-failed without redrawing; the score stays usable', async () => {
    const toolkit = fakeToolkit()
    const engine = createScoreEngine(toolkit)
    await engine.load({ format: 'musicxml', data: '<score/>' }, { pageWidth: 1800 })
    toolkit.setOptions.mockReturnValueOnce(false)

    expect(() => engine.relayout(900)).toThrow(expect.objectContaining({ code: 'render-failed' }))
    expect(toolkit.redoLayout).not.toHaveBeenCalled()
    expect(engine.relayout(900)).toHaveLength(2)
  })

  it('overlapping loads: the latest wins, earlier ones reject with superseded and are never parsed', async () => {
    const toolkit = fakeToolkit()
    const engine = createScoreEngine(toolkit)

    const first = engine.load({ format: 'musicxml', data: '<first/>' }, { pageWidth: 1000 })
    const second = engine.load({ format: 'musicxml', data: '<second/>' }, { pageWidth: 2000 })

    expect((await rejection(first)).code).toBe('superseded')
    expect((await second).svgPages[0]).toBe('<svg data-page="1" data-width="2000"/>')
    expect(toolkit.loadData).toHaveBeenCalledTimes(1)
    expect(toolkit.loadData).toHaveBeenCalledWith('<second/>')
  })

  it('relayout redraws svg at the new width without parsing the score again', async () => {
    const toolkit = fakeToolkit()
    const engine = createScoreEngine(toolkit)
    await engine.load({ format: 'musicxml', data: '<score/>' }, { pageWidth: 1800 })

    const pages = engine.relayout(900)

    expect(pages).toEqual(['<svg data-page="1" data-width="900"/>', '<svg data-page="2" data-width="900"/>'])
    expect(toolkit.redoLayout).toHaveBeenCalledTimes(1)
    expect(toolkit.loadData).toHaveBeenCalledTimes(1)
    expect(toolkit.loadZipDataBuffer).not.toHaveBeenCalled()
    expect(toolkit.renderToTimemap).toHaveBeenCalledTimes(1)
    expect(toolkit.getMEI).toHaveBeenCalledTimes(1)
  })

  it('relayout before any load throws not-loaded', () => {
    expect(() => createScoreEngine(fakeToolkit()).relayout(900)).toThrow(expect.objectContaining({ code: 'not-loaded' }))
  })

  it('mxl passes exactly the bytes of the view as an ArrayBuffer', async () => {
    const toolkit = fakeToolkit()
    const engine = createScoreEngine(toolkit)
    const backing = new Uint8Array([9, 9, 0x50, 0x4b, 3, 4, 9])
    const view = backing.subarray(2, 6)

    await engine.load({ format: 'mxl', data: view }, { pageWidth: 1800 })

    expect(toolkit.loadData).not.toHaveBeenCalled()
    const buffer = toolkit.loadZipDataBuffer.mock.calls[0][0]
    expect(buffer).toBeInstanceOf(ArrayBuffer)
    expect([...new Uint8Array(buffer)]).toEqual([0x50, 0x4b, 3, 4])
  })

  it('musicxml passes a string as is and decodes bytes as UTF-8', async () => {
    const toolkit = fakeToolkit()
    const engine = createScoreEngine(toolkit)

    await engine.load({ format: 'musicxml', data: '<lời/>' }, { pageWidth: 1800 })
    await engine.load({ format: 'musicxml', data: new TextEncoder().encode('<lời/>') }, { pageWidth: 1800 })

    expect(toolkit.loadData.mock.calls).toEqual([['<lời/>'], ['<lời/>']])
    expect(toolkit.loadZipDataBuffer).not.toHaveBeenCalled()
  })
})
