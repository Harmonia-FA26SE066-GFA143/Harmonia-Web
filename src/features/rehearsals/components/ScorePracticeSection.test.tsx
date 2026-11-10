import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { spacing } from '@/styles/tokens'
import type { LoadedScore } from '../score/engine'
import { DevFixtureScoreSource } from '../score/source/DevFixtureScoreSource'
import { ScoreSourceError, type ScorePackage } from '../score/source/types'
import { ACTIVE_NOTE_CLASS } from '../score/sync/useScoreSync'
import { toEnginePageWidth } from '../score/viewer'
import { MAX_PAGE_CHARS } from '../score/viewer/sanitizeSvg'
import { ScorePracticeSection } from './ScorePracticeSection'

const mocks = vi.hoisted(() => ({
  env: { useDevFixtures: false },
  createVerovioEngine: vi.fn(),
}))
vi.mock('@/config/env', () => ({ env: mocks.env }))
vi.mock('../score/engine', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../score/engine')>()),
  createVerovioEngine: mocks.createVerovioEngine,
}))

class FakeAudio {
  static instances: FakeAudio[] = []
  currentTime = 0
  duration = NaN
  ended = false
  paused = true
  src = ''
  preload = ''
  private handlers = new Map<string, Set<() => void>>()
  constructor() {
    FakeAudio.instances.push(this)
  }
  addEventListener(type: string, fn: () => void) {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set())
    this.handlers.get(type)!.add(fn)
  }
  removeEventListener(type: string, fn: () => void) {
    this.handlers.get(type)?.delete(fn)
  }
  dispatch(type: string) {
    for (const fn of [...(this.handlers.get(type) ?? [])]) fn()
  }
  play() {
    return Promise.resolve()
  }
  pause() {}
  removeAttribute() {
    this.src = ''
  }
  load() {}
}

class FakeResizeObserver {
  static instances: FakeResizeObserver[] = []
  observed: Element[] = []
  private readonly callback: ResizeObserverCallback
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
    FakeResizeObserver.instances.push(this)
  }
  observe(target: Element) {
    this.observed.push(target)
  }
  unobserve() {}
  disconnect() {}
  resize(width: number) {
    const entry = { target: this.observed[0], contentRect: { width } } as unknown as ResizeObserverEntry
    this.callback([entry], this as unknown as ResizeObserver)
  }
}

const page = (...ids: string[]) =>
  `<svg xmlns="http://www.w3.org/2000/svg">${ids.map((id) => `<g id="${id}" class="note"><path d="M0 0"/></g>`).join('')}</svg>`
const TIMEMAP = [
  { tstamp: 0, on: ['n1'] },
  { tstamp: 10000, off: ['n1'] },
]

function fakeEngine() {
  return {
    load: vi.fn(async (): Promise<LoadedScore> => ({ svgPages: [page('n1')], mei: '<mei/>', timemap: TIMEMAP, aliases: new Map() })),
    relayout: vi.fn(() => [page('n1')]),
    dispose: vi.fn(),
  }
}

const TITLE = 'Kinh Hoà Bình'
const FALLBACK = 'Piano roll dự phòng'
const renderSection = () => render(<ScorePracticeSection title={TITLE} fallback={<p>{FALLBACK}</p>} />)
const findSheet = () => screen.findByRole('group', { name: 'Bản nhạc' })
const scoreFile = (name = 'bai.mxl', size?: number) => {
  const file = new File(['xml'], name)
  if (size !== undefined) Object.defineProperty(file, 'size', { value: size })
  return file
}
const audioFile = (name = 'bai.wav') => new File(['wav'], name)
const pick = (label: RegExp, file: File) => fireEvent.change(screen.getByLabelText(label), { target: { files: [file] } })
const pickBoth = (score = scoreFile(), audio = audioFile()) => {
  pick(/Tệp bản nhạc/, score)
  pick(/Tệp âm thanh/, audio)
}
const devPackage = (): ScorePackage => ({
  score: { data: new Uint8Array([1]), format: 'mxl', fileName: 'sample.mxl' },
  audioUrl: '/sample.wav',
  dispose: vi.fn(),
})
const setAudioDuration = (seconds: number) =>
  act(() => {
    const audio = FakeAudio.instances.at(-1)!
    audio.duration = seconds
    audio.dispatch('loadedmetadata')
  })

let engines: ReturnType<typeof fakeEngine>[]
let originalObserver: typeof ResizeObserver

beforeEach(() => {
  engines = []
  mocks.env.useDevFixtures = false
  mocks.createVerovioEngine.mockReset()
  mocks.createVerovioEngine.mockImplementation(async () => {
    const engine = fakeEngine()
    engines.push(engine)
    return engine
  })
  FakeAudio.instances = []
  vi.stubGlobal('Audio', FakeAudio)
  FakeResizeObserver.instances = []
  originalObserver = window.ResizeObserver
  window.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver
  let nextUrl = 0
  URL.createObjectURL = vi.fn(() => `blob:audio-${(nextUrl += 1)}`)
  URL.revokeObjectURL = vi.fn()
})

afterEach(() => {
  window.ResizeObserver = originalObserver
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('ScorePracticeSection, source choice', () => {
  it('with the dev flag off it offers the file picker, keeps the fallback and never touches the fixture', () => {
    const load = vi.spyOn(DevFixtureScoreSource.prototype, 'load')
    renderSection()
    expect(screen.getByLabelText(/Tệp bản nhạc/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Tệp âm thanh/)).toBeInTheDocument()
    expect(screen.getByText(FALLBACK)).toBeInTheDocument()
    expect(load).not.toHaveBeenCalled()
    expect(mocks.createVerovioEngine).not.toHaveBeenCalled()
  })

  it('with the dev flag on it loads the fixture and shows no picker', async () => {
    mocks.env.useDevFixtures = true
    const load = vi.spyOn(DevFixtureScoreSource.prototype, 'load').mockResolvedValue(devPackage())
    renderSection()
    await findSheet()
    expect(load).toHaveBeenCalled()
    expect(screen.queryByLabelText(/Tệp bản nhạc/)).not.toBeInTheDocument()
  })

  it('offers Vietnamese buttons that open the hidden file inputs and show what was chosen', () => {
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
    renderSection()
    const scoreButton = screen.getByRole('button', { name: 'Chọn tệp bản nhạc' })
    const audioButton = screen.getByRole('button', { name: 'Chọn tệp âm thanh' })
    expect(scoreButton).toHaveAccessibleDescription('Tệp bản nhạc (.musicxml, .mxl) Chưa chọn tệp')
    fireEvent.click(scoreButton)
    expect(click.mock.contexts).toEqual([screen.getByLabelText(/Tệp bản nhạc/)])
    fireEvent.click(audioButton)
    expect(click.mock.contexts.at(-1)).toBe(screen.getByLabelText(/Tệp âm thanh/))
    pick(/Tệp bản nhạc/, scoreFile('kinh-hoa-binh.mxl'))
    expect(screen.getByText('kinh-hoa-binh.mxl')).toBeInTheDocument()
    expect(scoreButton).toHaveAccessibleDescription('Tệp bản nhạc (.musicxml, .mxl) kinh-hoa-binh.mxl')
  })

  it('waits for both files', () => {
    renderSection()
    pick(/Tệp bản nhạc/, scoreFile())
    expect(mocks.createVerovioEngine).not.toHaveBeenCalled()
    expect(screen.getByText(FALLBACK)).toBeInTheDocument()
  })
})

describe('ScorePracticeSection, a loaded package', () => {
  it('shows the viewer and the controls in place of the fallback and plays the package audio', async () => {
    renderSection()
    pickBoth()
    expect(await findSheet()).toBeInTheDocument()
    expect(screen.getByRole('button', { name: `Phát ${TITLE}` })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: `Vị trí phát ${TITLE}` })).toBeInTheDocument()
    expect(screen.queryByText(FALLBACK)).not.toBeInTheDocument()
    expect(FakeAudio.instances.at(-1)?.src).toBe('blob:audio-1')
    expect(engines[0].load).toHaveBeenCalledWith(expect.objectContaining({ format: 'mxl', data: expect.any(Uint8Array) }), { pageWidth: expect.any(Number) })
  })

  it('lights the sounding note on the mounted sheet', async () => {
    renderSection()
    pickBoth()
    const sheet = await findSheet()
    await waitFor(() => expect(sheet.querySelector(`#n1.${ACTIVE_NOTE_CLASS}`)).not.toBeNull())
  })

  it('lights the original note while a repeat plays it under another id', async () => {
    mocks.createVerovioEngine.mockImplementationOnce(async () => {
      const engine = fakeEngine()
      engine.load.mockResolvedValue({
        svgPages: [page('n1', 'n2')],
        mei: '<mei/>',
        timemap: [
          { tstamp: 0, on: ['n1'] },
          { tstamp: 1000, off: ['n1'], on: ['n2'] },
          { tstamp: 2000, off: ['n2'], on: ['n1-rend2'] },
          { tstamp: 3000, off: ['n1-rend2'] },
        ],
        aliases: new Map([['n1-rend2', 'n1']]),
      })
      engines.push(engine)
      return engine
    })
    renderSection()
    pickBoth()
    const sheet = await findSheet()
    act(() => {
      const audio = FakeAudio.instances.at(-1)!
      audio.currentTime = 2.5
      audio.dispatch('seeked')
    })
    expect([...sheet.querySelectorAll(`.${ACTIVE_NOTE_CLASS}`)].map((element) => element.id)).toEqual(['n1'])
  })

  it('shows the loading state of the viewer while the package is prepared', async () => {
    let release: (engine: ReturnType<typeof fakeEngine>) => void = () => {}
    mocks.createVerovioEngine.mockImplementationOnce(() => new Promise((resolve) => (release = resolve)))
    renderSection()
    pickBoth()
    expect(await screen.findByRole('status', { name: 'Đang tải bản nhạc' })).toBeInTheDocument()
    expect(screen.queryByText(FALLBACK)).not.toBeInTheDocument()
    const engine = fakeEngine()
    await waitFor(() => expect(mocks.createVerovioEngine).toHaveBeenCalled())
    release(engine)
    await findSheet()
  })

  it('a resize redraws through the engine without loading again', async () => {
    renderSection()
    pickBoth()
    await findSheet()
    const width = 900
    act(() => FakeResizeObserver.instances[0].resize(width + 2 * (spacing.xl + 1)))
    await waitFor(() => expect(engines[0].relayout).toHaveBeenCalled(), { timeout: 1000 })
    expect(engines[0].load).toHaveBeenCalledTimes(1)
    expect(engines[0].relayout.mock.calls[0]).toEqual([toEnginePageWidth(width)])
  })

  it('a width that maps to the page already drawn does not redraw', async () => {
    renderSection()
    pickBoth()
    await findSheet()
    act(() => FakeResizeObserver.instances[0].resize(100 + 2 * (spacing.xl + 1))) // below the engine's minimum page
    await act(() => new Promise((resolve) => setTimeout(resolve, 300)))
    expect(engines[0].relayout).not.toHaveBeenCalled()
  })

  it('a width known before the load is used by the load, with no extra redraw', async () => {
    let release: (engine: ReturnType<typeof fakeEngine>) => void = () => {}
    mocks.createVerovioEngine.mockImplementationOnce(() => new Promise((resolve) => (release = resolve)))
    renderSection()
    pickBoth()
    await waitFor(() => expect(mocks.createVerovioEngine).toHaveBeenCalled())
    const width = 900
    act(() => FakeResizeObserver.instances[0].resize(width + 2 * (spacing.xl + 1)))
    await act(() => new Promise((resolve) => setTimeout(resolve, 300)))
    const engine = fakeEngine()
    release(engine)
    await findSheet()
    expect(engine.load).toHaveBeenCalledWith(expect.anything(), { pageWidth: toEnginePageWidth(width) })
    expect(engine.relayout).not.toHaveBeenCalled()
  })

  it('warns when the audio and the score differ past the tolerance', async () => {
    renderSection()
    pickBoth()
    await findSheet()
    setAudioDuration(14)
    expect(screen.getByRole('alert')).toHaveTextContent('Âm thanh dài hơn bản nhạc khoảng 4 giây')
    setAudioDuration(3)
    expect(screen.getByRole('alert')).toHaveTextContent('Âm thanh ngắn hơn bản nhạc khoảng 7 giây')
  })

  it('does not warn within the tolerance or before the audio has a duration', async () => {
    renderSection()
    pickBoth()
    await findSheet()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    setAudioDuration(10.4)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

/** The next engine's `load` waits for `finish()`; `relayout` draws a page with a marker note the test can find. */
function holdNextLoad() {
  const engine = fakeEngine()
  let finish: () => void = () => {}
  engine.load.mockImplementation(
    () =>
      new Promise<LoadedScore>((resolve) => {
        finish = () => resolve({ svgPages: [page('n1')], mei: '<mei/>', timemap: TIMEMAP, aliases: new Map() })
      }),
  )
  engine.relayout.mockImplementation(() => [page('n1', 'relaid')])
  mocks.createVerovioEngine.mockImplementationOnce(async () => {
    engines.push(engine)
    return engine
  })
  return { engine, finish: () => act(async () => finish()) }
}

/** A sheet width report from the viewer (it debounces by 200 ms). */
const reportWidth = async (contentWidth: number) => {
  act(() => FakeResizeObserver.instances[0].resize(contentWidth + 2 * (spacing.xl + 1)))
  await act(() => new Promise((resolve) => setTimeout(resolve, 300)))
}

describe('ScorePracticeSection, a width that changes while the engine loads', () => {
  it('redraws at the new width before the viewer gets any page', async () => {
    const held = holdNextLoad()
    renderSection()
    pickBoth()
    await waitFor(() => expect(held.engine.load).toHaveBeenCalled())
    await reportWidth(900)
    await held.finish()
    const sheet = await findSheet()
    expect(held.engine.relayout.mock.calls).toEqual([[toEnginePageWidth(900)]])
    expect(sheet.querySelector('#relaid')).not.toBeNull()
  })

  it('does not redraw when the width maps to the page the load drew', async () => {
    const held = holdNextLoad()
    renderSection()
    pickBoth()
    await waitFor(() => expect(held.engine.load).toHaveBeenCalled())
    await reportWidth(100) // below the engine's minimum page, which the load already used
    await held.finish()
    await findSheet()
    expect(held.engine.relayout).not.toHaveBeenCalled()
  })

  it('uses only the last of several widths', async () => {
    const held = holdNextLoad()
    renderSection()
    pickBoth()
    await waitFor(() => expect(held.engine.load).toHaveBeenCalled())
    await reportWidth(700)
    await reportWidth(1100)
    await held.finish()
    await findSheet()
    expect(held.engine.relayout.mock.calls).toEqual([[toEnginePageWidth(1100)]])
  })

  it('another file picked while the engine is busy wins: the old result is dropped when it lands', async () => {
    const held = holdNextLoad()
    renderSection()
    pickBoth()
    await waitFor(() => expect(held.engine.load).toHaveBeenCalled())
    // The busy load shows the viewer's loading state; the picker stays usable.
    expect(screen.getByRole('status', { name: 'Đang tải bản nhạc' })).toBeInTheDocument()
    pick(/Tệp âm thanh/, audioFile('khac.wav'))
    const sheet = await findSheet()
    await held.finish()
    expect(held.engine.dispose).toHaveBeenCalled()
    expect(held.engine.relayout).not.toHaveBeenCalled()
    expect(engines).toHaveLength(2)
    expect(sheet.isConnected).toBe(true)
    expect(FakeAudio.instances.at(-1)?.src).toBe('blob:audio-2')
  })

  it('does not redraw for a player that is gone', async () => {
    const held = holdNextLoad()
    const view = renderSection()
    pickBoth()
    await waitFor(() => expect(held.engine.load).toHaveBeenCalled())
    await reportWidth(900)
    view.unmount()
    await held.finish()
    expect(held.engine.relayout).not.toHaveBeenCalled()
  })
})

/** The next engine loads pages the viewer refuses (past its size limit). */
function refuseNextLoad() {
  mocks.createVerovioEngine.mockImplementationOnce(async () => {
    const engine = fakeEngine()
    engine.load.mockResolvedValue({ svgPages: ['<svg>' + ' '.repeat(MAX_PAGE_CHARS) + '</svg>'], mei: '<mei/>', timemap: TIMEMAP, aliases: new Map() })
    engines.push(engine)
    return engine
  })
}

describe('ScorePracticeSection, failures', () => {
  it.each([
    ['a score of the wrong type', () => pickBoth(scoreFile('bai.pdf')), 'Tệp bản nhạc cần có đuôi .musicxml hoặc .mxl'],
    ['an audio of the wrong type', () => pickBoth(scoreFile(), audioFile('bai.mp3')), 'Tệp âm thanh cần có đuôi .wav'],
    ['a score that is too large', () => pickBoth(scoreFile('bai.mxl', 21 * 1024 * 1024)), 'Tệp bản nhạc lớn hơn 20 MB'],
  ])('%s: says so in Vietnamese, keeps the fallback, offers no retry', async (_name, act_, message) => {
    renderSection()
    act_()
    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(screen.getByText(FALLBACK)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Thử lại/ })).not.toBeInTheDocument()
    expect(mocks.createVerovioEngine).not.toHaveBeenCalled()
  })

  it('a dev source that is unavailable reports it without a retry', async () => {
    mocks.env.useDevFixtures = true
    vi.spyOn(DevFixtureScoreSource.prototype, 'load').mockRejectedValue(new ScoreSourceError('unavailable', 'Bản nhạc mẫu chỉ dùng khi phát triển.'))
    renderSection()
    expect(await screen.findByRole('alert')).toHaveTextContent('Bản nhạc mẫu chỉ dùng khi phát triển.')
    expect(screen.queryByRole('button', { name: /Thử lại/ })).not.toBeInTheDocument()
  })

  it('a source read failure shows the viewer error, retry and the fallback; retry loads again', async () => {
    mocks.env.useDevFixtures = true
    const load = vi
      .spyOn(DevFixtureScoreSource.prototype, 'load')
      .mockRejectedValueOnce(new ScoreSourceError('read-failed', 'Không đọc được bản nhạc mẫu.'))
      .mockResolvedValue(devPackage())
    renderSection()
    const retry = await screen.findByRole('button', { name: /Thử lại/ })
    expect(screen.getByText('Không thể hiển thị bản nhạc')).toBeInTheDocument()
    expect(screen.getByText(FALLBACK)).toBeInTheDocument()
    const callsBefore = load.mock.calls.length
    fireEvent.click(retry)
    await findSheet()
    expect(load.mock.calls.length).toBeGreaterThan(callsBefore)
    expect(screen.queryByText(FALLBACK)).not.toBeInTheDocument()
  })

  it('pages the viewer refuses free the package and the engine at once, and only once', async () => {
    refuseNextLoad()
    const view = renderSection()
    pickBoth()
    await screen.findByRole('button', { name: /Thử lại/ })
    expect(screen.getByText(FALLBACK)).toBeInTheDocument()
    expect(vi.mocked(URL.revokeObjectURL).mock.calls).toEqual([['blob:audio-1']])
    expect(engines[0].dispose).toHaveBeenCalledTimes(1)
    expect(FakeAudio.instances.every((audio) => audio.src === '')).toBe(true)
    view.unmount()
    expect(vi.mocked(URL.revokeObjectURL).mock.calls).toEqual([['blob:audio-1']])
    expect(engines[0].dispose).toHaveBeenCalledTimes(1)
  })

  it('a retry that is refused again frees its own attempt once and leaves the first alone', async () => {
    refuseNextLoad()
    refuseNextLoad()
    renderSection()
    pickBoth()
    fireEvent.click(await screen.findByRole('button', { name: /Thử lại/ }))
    await waitFor(() => expect(engines).toHaveLength(2))
    await waitFor(() => expect(engines[1].dispose).toHaveBeenCalled())
    await screen.findByRole('button', { name: /Thử lại/ })
    expect(engines[0].dispose).toHaveBeenCalledTimes(1)
    expect(engines[1].dispose).toHaveBeenCalledTimes(1)
    expect(vi.mocked(URL.revokeObjectURL).mock.calls).toEqual([['blob:audio-1'], ['blob:audio-2']])
  })

  it('an engine that fails to load is freed once, not again on unmount', async () => {
    mocks.createVerovioEngine.mockImplementationOnce(async () => {
      const engine = fakeEngine()
      engine.load.mockRejectedValue(new Error('bad score'))
      engines.push(engine)
      return engine
    })
    const view = renderSection()
    pickBoth()
    await screen.findByRole('button', { name: /Thử lại/ })
    expect(engines[0].dispose).toHaveBeenCalledTimes(1)
    expect(vi.mocked(URL.revokeObjectURL).mock.calls).toEqual([['blob:audio-1']])
    view.unmount()
    expect(engines[0].dispose).toHaveBeenCalledTimes(1)
    expect(vi.mocked(URL.revokeObjectURL).mock.calls).toEqual([['blob:audio-1']])
  })

  it('pages the viewer refuses end the ready state: fallback, no controls, audio released, retry loads again', async () => {
    mocks.createVerovioEngine.mockImplementationOnce(async () => {
      const engine = fakeEngine()
      engine.load.mockResolvedValue({ svgPages: ['<svg>' + ' '.repeat(MAX_PAGE_CHARS) + '</svg>'], mei: '<mei/>', timemap: TIMEMAP, aliases: new Map() })
      engines.push(engine)
      return engine
    })
    renderSection()
    pickBoth()
    const retry = await screen.findByRole('button', { name: /Thử lại/ })
    expect(screen.getByText(FALLBACK)).toBeInTheDocument()
    expect(screen.queryByRole('slider')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: `Phát ${TITLE}` })).not.toBeInTheDocument()
    expect(FakeAudio.instances.every((audio) => audio.src === '')).toBe(true)
    fireEvent.click(retry)
    await findSheet()
    expect(engines).toHaveLength(2)
    expect(screen.getByRole('slider', { name: `Vị trí phát ${TITLE}` })).toBeInTheDocument()
  })

  it('an engine failure frees the package and falls back with a retry', async () => {
    mocks.env.useDevFixtures = true
    const pack = devPackage()
    vi.spyOn(DevFixtureScoreSource.prototype, 'load').mockResolvedValue(pack)
    mocks.createVerovioEngine.mockRejectedValue(new Error('no wasm'))
    renderSection()
    expect(await screen.findByRole('button', { name: /Thử lại/ })).toBeInTheDocument()
    expect(screen.getByText(FALLBACK)).toBeInTheDocument()
    expect(pack.dispose).toHaveBeenCalled()
  })
})

describe('ScorePracticeSection, disposal', () => {
  it('another file frees the engine and the object URL, then loads the new pair', async () => {
    renderSection()
    pickBoth()
    await findSheet()
    pick(/Tệp âm thanh/, audioFile('khac.wav'))
    await waitFor(() => expect(engines).toHaveLength(2))
    expect(engines[0].dispose).toHaveBeenCalled()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:audio-1')
    await waitFor(() => expect(FakeAudio.instances.at(-1)?.src).toBe('blob:audio-2'))
    expect(engines[1].dispose).not.toHaveBeenCalled()
  })

  it('unmount frees the engine and the object URL and releases the audio', async () => {
    const view = renderSection()
    pickBoth()
    await findSheet()
    const audio = FakeAudio.instances.at(-1)!
    view.unmount()
    expect(engines[0].dispose).toHaveBeenCalled()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:audio-1')
    expect(audio.src).toBe('')
  })

  it('a package that arrives after unmount is freed and no engine is made', async () => {
    mocks.env.useDevFixtures = true
    const pack = devPackage()
    let deliver: (value: ScorePackage) => void = () => {}
    vi.spyOn(DevFixtureScoreSource.prototype, 'load').mockImplementation(() => new Promise((resolve) => (deliver = resolve)))
    const view = renderSection()
    view.unmount()
    await act(async () => deliver(pack))
    expect(pack.dispose).toHaveBeenCalled()
    expect(mocks.createVerovioEngine).not.toHaveBeenCalled()
  })

  it('an engine that arrives after unmount is freed', async () => {
    mocks.env.useDevFixtures = true
    vi.spyOn(DevFixtureScoreSource.prototype, 'load').mockResolvedValue(devPackage())
    const engine = fakeEngine()
    let deliver: (value: ReturnType<typeof fakeEngine>) => void = () => {}
    mocks.createVerovioEngine.mockImplementation(() => new Promise((resolve) => (deliver = resolve)))
    const view = renderSection()
    await waitFor(() => expect(mocks.createVerovioEngine).toHaveBeenCalled())
    view.unmount()
    await act(async () => deliver(engine))
    expect(engine.dispose).toHaveBeenCalled()
    expect(engine.load).not.toHaveBeenCalled()
  })
})
