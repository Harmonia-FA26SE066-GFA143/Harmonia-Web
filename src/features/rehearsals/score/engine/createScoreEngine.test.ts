import { describe, expect, it, vi } from 'vitest'
import { createScoreEngine } from './createScoreEngine'
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
    redoLayout: vi.fn(),
    destroy: vi.fn(),
  }
  return Object.assign(toolkit, overrides)
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
    })
    expect(toolkit.renderToTimemap).toHaveBeenCalledWith({ includeMeasures: true })
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
