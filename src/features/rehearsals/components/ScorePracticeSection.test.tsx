import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { spacing } from '@/styles/tokens'
import type { LoadedScore } from '../score/engine'
import { DevFixtureScoreSource } from '../score/source/DevFixtureScoreSource'
import { ScoreSourceError, type ScorePackage } from '../score/source/types'
import { ACTIVE_LYRIC_CLASS } from '../score/sync/useLyricSync'
import { ACTIVE_NOTE_CLASS } from '../score/sync/useScoreSync'
import { MIN_ENGINE_PAGE_WIDTH, PHONE_ENGINE_PAGE_WIDTH, toEnginePageWidth } from '../score/viewer'
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
    // The audio source is set by an effect, which may run after the DOM that findSheet waited for.
    await waitFor(() => expect(FakeAudio.instances.at(-1)?.src).toBe('blob:audio-1'))
    expect(engines[0].load).toHaveBeenCalledWith(expect.objectContaining({ format: 'mxl', data: expect.any(Uint8Array) }), { pageWidth: expect.any(Number) })
  })

  it('shows the controls as soon as the score is ready, without waiting to be scrolled into view', async () => {
    // A viewer with motion on and a sheet that never scrolls into view; the test setup otherwise reports reduced motion.
    vi.stubGlobal('IntersectionObserver', class {
      observe() {}
      disconnect() {}
    })
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (media) => ({ matches: false, media, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }) as unknown as MediaQueryList,
    )
    renderSection()
    pickBoth()
    await findSheet()
    const play = screen.getByRole('button', { name: `Phát ${TITLE}` })
    expect(play.closest('.hm-reveal:not(.is-visible)')).toBeNull()
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
    // 305 px of content is 396.5 engine units: under the minimum, so it maps to the page drawn at load (the minimum).
    // (Before the narrow-sheet rule P7 fix 2 this test used 100 px, which now maps to the phone page and does redraw.)
    act(() => FakeResizeObserver.instances[0].resize(305 + 2 * (spacing.xl + 1)))
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

describe('ScorePracticeSection, playing from the sheet', () => {
  // n1 sounds 0–1 s and again 2–3 s (a repeat, drawn once); n2 sounds 1–2 s.
  const loadRepeatScore = async () => {
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
    setAudioDuration(60)
    return sheet
  }
  const audio = () => FakeAudio.instances.at(-1)!

  it('a click on a note moves the audio there, to the occurrence nearest in time, and does not start playing', async () => {
    const play = vi.spyOn(FakeAudio.prototype, 'play')
    const sheet = await loadRepeatScore()
    fireEvent.click(sheet.querySelector('#n2')!)
    expect(audio().currentTime).toBe(1)
    fireEvent.click(sheet.querySelector('#n1')!) // at 1 s n1 (0 s and 2 s) is a tie: the earlier plays again
    expect(audio().currentTime).toBe(0)
    expect(sheet.querySelector(`#n1.${ACTIVE_NOTE_CLASS}`)).not.toBeNull()
    expect(play).not.toHaveBeenCalled()
  })

  it('a click on the paper changes nothing', async () => {
    const sheet = await loadRepeatScore()
    fireEvent.click(sheet)
    expect(audio().currentTime).toBe(0)
  })

  it('shortcuts act with the focus on the sheet and leave the page alone otherwise', async () => {
    const play = vi.spyOn(FakeAudio.prototype, 'play')
    const sheet = await loadRepeatScore()
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    expect(audio().currentTime).toBe(0)
    fireEvent.keyDown(sheet, { key: 'ArrowRight' })
    expect(audio().currentTime).toBe(5)
    fireEvent.keyDown(sheet, { key: 'Home' })
    expect(audio().currentTime).toBe(0)
    fireEvent.keyDown(sheet, { key: ' ' })
    expect(play).toHaveBeenCalledTimes(1)
    // Space and Home are shortcuts, not scrolling: following goes on
    expect(screen.queryByRole('button', { name: 'Theo dõi nốt đang hát' })).not.toBeInTheDocument()
    // Space on the play button is the button's own click, not a second toggle.
    fireEvent.keyDown(screen.getByRole('button', { name: `Phát ${TITLE}` }), { key: ' ' })
    expect(play).toHaveBeenCalledTimes(1)
  })

  it('announces the shortcuts on the play button', async () => {
    await loadRepeatScore()
    expect(screen.getByRole('button', { name: `Phát ${TITLE}` })).toHaveAttribute('aria-keyshortcuts', 'Space ArrowLeft ArrowRight Home')
  })

  it('pressing "Theo dõi" keeps the focus inside the section, so the shortcuts still work', async () => {
    const play = vi.spyOn(FakeAudio.prototype, 'play')
    const sheet = await loadRepeatScore()
    fireEvent.wheel(sheet, { deltaY: 80 })
    const follow = await screen.findByRole('button', { name: 'Theo dõi nốt đang hát' })
    follow.focus()
    expect(document.activeElement).toBe(follow)
    fireEvent.click(follow) // what Enter does on a button
    expect(screen.queryByRole('button', { name: 'Theo dõi nốt đang hát' })).not.toBeInTheDocument()
    expect(document.activeElement).toBe(sheet)
    fireEvent.keyDown(document.activeElement!, { key: ' ' })
    expect(play).toHaveBeenCalledTimes(1)
  })

  it('shows "Theo dõi" after the user scrolls the sheet, and pressing it brings the follow back', async () => {
    const sheet = await loadRepeatScore()
    expect(screen.queryByRole('button', { name: 'Theo dõi nốt đang hát' })).not.toBeInTheDocument()
    fireEvent.wheel(sheet, { deltaY: 80 })
    const follow = await screen.findByRole('button', { name: 'Theo dõi nốt đang hát' })
    expect(follow).toHaveTextContent('Theo dõi')
    fireEvent.click(follow)
    expect(screen.queryByRole('button', { name: 'Theo dõi nốt đang hát' })).not.toBeInTheDocument()
  })
})

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
    // 305 px of content is 396.5 units: under the minimum, which the load already used. (Was 100 px before the narrow-sheet
    // rule of P7 fix 2; 100 px now maps to the phone page, see the next test.)
    await reportWidth(305)
    await held.finish()
    await findSheet()
    expect(held.engine.relayout).not.toHaveBeenCalled()
  })

  it('a phone-width sheet is drawn on the wide phone page, not the minimum', async () => {
    const held = holdNextLoad()
    renderSection()
    pickBoth()
    await waitFor(() => expect(held.engine.load).toHaveBeenCalled())
    await reportWidth(285) // 375 px window, focus mode
    await held.finish()
    await findSheet()
    expect(held.engine.relayout.mock.calls).toEqual([[PHONE_ENGINE_PAGE_WIDTH]])
    expect(PHONE_ENGINE_PAGE_WIDTH).toBeGreaterThan(MIN_ENGINE_PAGE_WIDTH)
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
    await waitFor(() => expect(FakeAudio.instances.at(-1)?.src).toBe('blob:audio-2'))
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
    // The clock lets go of the audio in an effect cleanup, after the error card is already on screen: wait for it.
    await waitFor(() => expect(FakeAudio.instances.every((audio) => audio.src === '')).toBe(true))
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
    await waitFor(() => expect(FakeAudio.instances.every((audio) => audio.src === '')).toBe(true))
    fireEvent.click(retry)
    await findSheet()
    expect(engines).toHaveLength(2)
    expect(screen.getByRole('slider', { name: `Vị trí phát ${TITLE}` })).toBeInTheDocument()
  })

  it.each([
    ['an empty timemap', []],
    ['a timemap with only rests', [{ tstamp: 0 }, { tstamp: 1000 }]],
  ])('a score that renders with %s is refused: a message, the fallback, everything freed once, no audio', async (_name, timemap) => {
    let engine: ReturnType<typeof fakeEngine> | undefined
    mocks.createVerovioEngine.mockImplementationOnce(async () => {
      engine = fakeEngine()
      engine.load.mockResolvedValue({ svgPages: ['<svg xmlns="http://www.w3.org/2000/svg"></svg>'], mei: '<mei/>', timemap, aliases: new Map() })
      return engine
    })
    const view = renderSection()
    pickBoth()
    expect(await screen.findByRole('alert')).toHaveTextContent('Không đọc được nốt nhạc nào trong tệp này. Vui lòng kiểm tra lại tệp MusicXML.')
    expect(screen.getByText(FALLBACK)).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Bản nhạc' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: `Phát ${TITLE}` })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Thử lại/ })).not.toBeInTheDocument()
    expect(FakeAudio.instances.filter((audio) => audio.src !== '')).toHaveLength(0)
    expect(vi.mocked(URL.revokeObjectURL).mock.calls).toEqual([['blob:audio-1']])
    expect(engine!.dispose).toHaveBeenCalledTimes(1)
    view.unmount()
    expect(vi.mocked(URL.revokeObjectURL).mock.calls).toEqual([['blob:audio-1']])
    expect(engine!.dispose).toHaveBeenCalledTimes(1)
  })

  it('a score of a single note without lyrics stays ready', async () => {
    renderSection()
    pickBoth()
    await findSheet()
    expect(screen.getByRole('button', { name: `Phát ${TITLE}` })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByText(FALLBACK)).not.toBeInTheDocument()
    expect(engines[0].dispose).not.toHaveBeenCalled()
  })

  it('an audio that never loads brings the fallback back and keeps the sheet to read', async () => {
    renderSection()
    pickBoth()
    await findSheet()
    await waitFor(() => expect(FakeAudio.instances.at(-1)?.src).toBe('blob:audio-1'))
    act(() => FakeAudio.instances.at(-1)!.dispatch('error'))
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể phát âm thanh')
    expect(screen.getByText(FALLBACK)).toBeInTheDocument()
    expect(await findSheet()).toBeInTheDocument()
  })

  it('a play refused after the audio loaded keeps the fallback away: the score can still sound, so two players could', async () => {
    renderSection()
    pickBoth()
    await findSheet()
    await waitFor(() => expect(FakeAudio.instances.at(-1)?.src).toBe('blob:audio-1'))
    setAudioDuration(10)
    vi.spyOn(FakeAudio.instances.at(-1)!, 'play').mockRejectedValueOnce(new Error('NotAllowedError'))
    fireEvent.click(screen.getByRole('button', { name: `Phát ${TITLE}` }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể phát âm thanh')
    expect(screen.queryByText(FALLBACK)).not.toBeInTheDocument()
  })

  const readyWithAudio = async () => {
    renderSection()
    pickBoth()
    await findSheet()
    await waitFor(() => expect(FakeAudio.instances.at(-1)?.src).toBe('blob:audio-1'))
    return FakeAudio.instances.at(-1)!
  }
  const refusePlay = async (audio: FakeAudio) => {
    vi.spyOn(audio, 'play').mockRejectedValueOnce(new DOMException('blocked', 'NotAllowedError'))
    fireEvent.click(screen.getByRole('button', { name: `Phát ${TITLE}` }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể phát âm thanh')
  }

  it('a play refused before the audio has loaded keeps the fallback away', async () => {
    await refusePlay(await readyWithAudio())
    expect(screen.queryByText(FALLBACK)).not.toBeInTheDocument()
  })

  it('a play refused before loading, then a retry once loaded: the score alone sounds', async () => {
    const audio = await readyWithAudio()
    await refusePlay(audio)
    // In between too: a fallback shown here could be started and then play beside the score.
    expect(screen.queryByText(FALLBACK)).not.toBeInTheDocument()
    setAudioDuration(10)
    vi.spyOn(audio, 'play').mockImplementationOnce(() => {
      audio.paused = false
      audio.dispatch('play')
      return Promise.resolve()
    })
    fireEvent.click(screen.getByRole('button', { name: `Phát ${TITLE}` }))
    await screen.findByRole('button', { name: `Tạm dừng ${TITLE}` })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByText(FALLBACK)).not.toBeInTheDocument()
  })

  it('a play refused, then the audio fails to load: the fallback comes back', async () => {
    const audio = await readyWithAudio()
    await refusePlay(audio)
    act(() => audio.dispatch('error'))
    expect(await screen.findByText(FALLBACK)).toBeInTheDocument()
  })

  it('an audio that fails after it had loaded keeps the sheet and the message, without the fallback', async () => {
    const audio = await readyWithAudio()
    setAudioDuration(10)
    act(() => audio.dispatch('error'))
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể phát âm thanh')
    expect(screen.queryByText(FALLBACK)).not.toBeInTheDocument()
    expect(await findSheet()).toBeInTheDocument()
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

// One part, two verses on n1: "Ca" (verse 1) and "Hát" (verse 2).
const LYRIC_MEI = `<mei xmlns="http://www.music-encoding.org/ns/mei"><music><body><mdiv><score>
<scoreDef><staffGrp><staffDef n="1"><label>Nữ cao</label></staffDef></staffGrp></scoreDef>
<section><measure><staff n="1"><layer n="1"><note xml:id="n1">
  <verse n="1"><syl xml:id="v1">Ca</syl></verse><verse n="2"><syl xml:id="v2">Hát</syl></verse>
</note></layer></staff></measure></section></score></mdiv></body></music></mei>`
const LYRIC_PAGE = `<svg xmlns="http://www.w3.org/2000/svg"><g id="n1" class="note"><path d="M0 0"/>
<g class="verse"><g id="v1" class="syl"><text>Ca</text></g></g><g class="verse"><g id="v2" class="syl"><text>Hát</text></g></g></g></svg>`

const sungEngine = () =>
  mocks.createVerovioEngine.mockImplementationOnce(async () => {
    const engine = fakeEngine()
    engine.load.mockResolvedValue({ svgPages: [LYRIC_PAGE], mei: LYRIC_MEI, timemap: TIMEMAP, aliases: new Map() })
    engines.push(engine)
    return engine
  })
const litLyrics = (sheet: HTMLElement) => Array.from(sheet.querySelectorAll(`.${ACTIVE_LYRIC_CLASS}`), (el) => el.id)

describe('ScorePracticeSection, lyrics', () => {
  it('a score without lyrics offers no lyric choice and lights no syllable', async () => {
    renderSection()
    pickBoth()
    const sheet = await findSheet()
    expect(screen.queryByRole('combobox', { name: 'Khổ lời' })).toBeNull()
    expect(screen.queryByRole('combobox', { name: 'Lời của bè' })).toBeNull()
    expect(litLyrics(sheet)).toEqual([])
  })

  it('lights the first verse, and the chosen verse once another is picked', async () => {
    sungEngine()
    renderSection()
    pickBoth()
    const sheet = await findSheet()
    await waitFor(() => expect(litLyrics(sheet)).toEqual(['v1']))
    const verse = screen.getByRole('combobox', { name: 'Khổ lời' })
    act(() => verse.focus())
    fireEvent.keyDown(verse, { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40 })
    fireEvent.keyDown(verse, { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40 })
    fireEvent.keyDown(verse, { key: 'Enter', code: 'Enter', keyCode: 13 })
    await waitFor(() => expect(litLyrics(sheet)).toEqual(['v2']))
  })
})

describe('ScorePracticeSection, lyrics over tied notes', () => {
  // Hand-written: t1 (sung "Ca", tied to t2) 0–1 s, t2 1–2 s, n3 (sung "ngợi") 2–3 s.
  const tiedMei = (withTie: boolean) => `<mei xmlns="http://www.music-encoding.org/ns/mei"><music><body><mdiv><score>
<scoreDef><staffGrp><staffDef n="1"><label>Nữ cao</label></staffDef></staffGrp></scoreDef>
<section><measure><staff n="1"><layer n="1">
  <note xml:id="t1"><verse n="1"><syl xml:id="s-ca">Ca</syl></verse></note>
  <note xml:id="t2"/>
  <note xml:id="n3"><verse n="1"><syl xml:id="s-ngoi">ngợi</syl></verse></note>
</layer></staff>${withTie ? '<tie startid="#t1" endid="#t2"/>' : ''}</measure></section></score></mdiv></body></music></mei>`
  const TIED_PAGE = `<svg xmlns="http://www.w3.org/2000/svg">
<g id="t1" class="note"><path d="M0 0"/><g class="verse"><g id="s-ca" class="syl"><text>Ca</text></g></g></g>
<g id="t2" class="note"><path d="M0 0"/></g>
<g id="n3" class="note"><path d="M0 0"/><g class="verse"><g id="s-ngoi" class="syl"><text>ngợi</text></g></g></g></svg>`
  const TIED_TIMEMAP = [
    { tstamp: 0, on: ['t1'] },
    { tstamp: 1000, off: ['t1'], on: ['t2'] },
    { tstamp: 2000, off: ['t2'], on: ['n3'] },
    { tstamp: 3000, off: ['n3'] },
  ]

  async function openAt(withTie: boolean) {
    mocks.createVerovioEngine.mockImplementationOnce(async () => {
      const engine = fakeEngine()
      engine.load.mockResolvedValue({ svgPages: [TIED_PAGE], mei: tiedMei(withTie), timemap: TIED_TIMEMAP, aliases: new Map() })
      engines.push(engine)
      return engine
    })
    renderSection()
    pickBoth()
    const sheet = await findSheet()
    await waitFor(() => expect(sheet.querySelector('#s-ca')).not.toBeNull())
    const at = (seconds: number) => {
      act(() => {
        const audio = FakeAudio.instances.at(-1)!
        audio.currentTime = seconds
        audio.dispatch('seeked')
      })
      return {
        lyrics: Array.from(sheet.querySelectorAll(`.${ACTIVE_LYRIC_CLASS}`), (el) => el.id),
        notes: Array.from(sheet.querySelectorAll(`.${ACTIVE_NOTE_CLASS}`), (el) => el.id),
      }
    }
    return at
  }

  it('keeps the syllable of a tie head lit through its continuation, off at the group end', async () => {
    const at = await openAt(true)
    expect(at(0.5)).toEqual({ lyrics: ['s-ca'], notes: ['t1'] })
    // Notes still light one notehead at a time: the tie map changes nothing for them.
    expect(at(1.5)).toEqual({ lyrics: ['s-ca'], notes: ['t2'] })
    expect(at(1.999)).toEqual({ lyrics: ['s-ca'], notes: ['t2'] })
    expect(at(2)).toEqual({ lyrics: ['s-ngoi'], notes: ['n3'] })
  })

  it('without a tie the syllable ends with its own note, as before', async () => {
    const at = await openAt(false)
    expect(at(0.5)).toEqual({ lyrics: ['s-ca'], notes: ['t1'] })
    expect(at(1.5)).toEqual({ lyrics: [], notes: ['t2'] })
    expect(at(2)).toEqual({ lyrics: ['s-ngoi'], notes: ['n3'] })
  })
})

describe('ScorePracticeSection, focus mode', () => {
  const TOGGLE = { name: 'Chế độ tập trung' }
  const DIALOG = { name: `Chế độ tập trung: ${TITLE}` }
  const loadReady = async () => {
    const view = renderSection()
    pickBoth()
    const sheet = await findSheet()
    setAudioDuration(60)
    return { sheet, view }
  }
  const toggle = () => screen.getByRole('button', TOGGLE)
  const enter = async () => {
    const { sheet, view } = await loadReady()
    fireEvent.click(toggle())
    return { sheet, view, dialog: screen.getByRole('dialog', DIALOG) }
  }
  const openLyricSelect = async () => {
    sungEngine()
    renderSection()
    pickBoth()
    await findSheet()
    fireEvent.click(toggle())
    const verse = screen.getByRole('combobox', { name: 'Khổ lời' })
    act(() => verse.focus())
    return verse
  }

  it('offers the button once the score is ready, not while it loads, and announces its state and key', async () => {
    let release: (engine: ReturnType<typeof fakeEngine>) => void = () => {}
    mocks.createVerovioEngine.mockImplementationOnce(() => new Promise((resolve) => (release = resolve)))
    renderSection()
    pickBoth()
    await screen.findByRole('status', { name: 'Đang tải bản nhạc' })
    expect(screen.queryByRole('button', TOGGLE)).toBeNull()
    await waitFor(() => expect(mocks.createVerovioEngine).toHaveBeenCalled())
    release(fakeEngine())
    await findSheet()
    expect(toggle()).toHaveAttribute('aria-pressed', 'false')
    expect(toggle()).toHaveAttribute('aria-keyshortcuts', 'F')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('the button turns it on: a labelled modal dialog holding the sheet, the controls and the button, focus on it', async () => {
    const { sheet, dialog } = await enter()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(toggle()).toHaveAttribute('aria-pressed', 'true')
    expect(within(dialog).getByRole('group', { name: 'Bản nhạc' })).toBe(sheet)
    expect(within(dialog).getByRole('slider', { name: `Vị trí phát ${TITLE}` })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: `Phát ${TITLE}` })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', TOGGLE)).toBe(toggle())
    expect(document.activeElement).toBe(dialog)
  })

  it('does not rebuild the sheet, the button or the engine when it turns on and off', async () => {
    const { sheet } = await loadReady()
    const button = toggle()
    const play = screen.getByRole('button', { name: `Phát ${TITLE}` })
    fireEvent.click(button)
    expect(screen.getByRole('group', { name: 'Bản nhạc' })).toBe(sheet)
    expect(toggle()).toBe(button)
    expect(screen.getByRole('button', { name: `Phát ${TITLE}` })).toBe(play)
    fireEvent.click(button)
    expect(screen.getByRole('group', { name: 'Bản nhạc' })).toBe(sheet)
    expect(engines[0].load).toHaveBeenCalledTimes(1)
    expect(engines[0].relayout).not.toHaveBeenCalled()
  })

  it('hides the rest of the page from the keyboard and screen readers, and holds the page scroll', async () => {
    const { dialog } = await enter()
    expect(screen.getByRole('region', { name: 'Mở bản nhạc từ máy', hidden: true }).closest('[inert]')).not.toBeNull()
    expect(dialog.closest('[inert]')).toBeNull()
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('Esc leaves, gives the focus back to the button and puts the page back', async () => {
    const { sheet } = await enter()
    fireEvent.keyDown(sheet, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(toggle()).toHaveAttribute('aria-pressed', 'false')
    expect(document.activeElement).toBe(toggle())
    expect(screen.getByRole('region', { name: 'Mở bản nhạc từ máy' }).closest('[inert]')).toBeNull()
    expect(document.body.style.overflow).toBe('')
    expect(document.body.className).toBe('')
  })

  it('the button turns it off again', async () => {
    await enter()
    fireEvent.click(toggle())
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(toggle())
  })

  it('f turns it on from the sheet and off again, and is not heard elsewhere on the page', async () => {
    const { sheet } = await loadReady()
    fireEvent.keyDown(document.body, { key: 'f' })
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.keyDown(sheet, { key: 'f' })
    expect(screen.getByRole('dialog', DIALOG)).toBeInTheDocument()
    fireEvent.keyDown(screen.getByRole('dialog', DIALOG), { key: 'f' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('the playback shortcuts keep working in it, with the focus on the dialog', async () => {
    const play = vi.spyOn(FakeAudio.prototype, 'play')
    const { dialog } = await enter()
    const audio = FakeAudio.instances.at(-1)!
    fireEvent.keyDown(dialog, { key: ' ' })
    expect(play).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(dialog, { key: 'ArrowRight' })
    expect(audio.currentTime).toBe(5)
    fireEvent.keyDown(dialog, { key: 'Home' })
    expect(audio.currentTime).toBe(0)
  })

  it('can take the focus itself, so a click on its empty part keeps the shortcuts working', async () => {
    const { dialog } = await enter()
    expect(dialog).toHaveAttribute('tabindex', '-1')
  })

  it("keys typed in a lyric select are the select's: no shortcut, no leaving", async () => {
    const play = vi.spyOn(FakeAudio.prototype, 'play')
    const verse = await openLyricSelect()
    for (const key of ['f', ' ', 'ArrowRight', 'Home']) fireEvent.keyDown(verse, { key })
    expect(screen.getByRole('dialog', DIALOG)).toBeInTheDocument()
    expect(play).not.toHaveBeenCalled()
  })

  it('Esc with a select open closes the list first and stays in the mode; the next Esc leaves', async () => {
    const verse = await openLyricSelect()
    fireEvent.keyDown(verse, { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40 })
    await waitFor(() => expect(verse).toHaveAttribute('aria-expanded', 'true'))
    fireEvent.keyDown(verse, { key: 'Escape', code: 'Escape', keyCode: 27 })
    expect(screen.getByRole('dialog', DIALOG)).toBeInTheDocument()
    await waitFor(() => expect(verse).toHaveAttribute('aria-expanded', 'false'))
    fireEvent.keyDown(verse, { key: 'Escape', code: 'Escape', keyCode: 27 })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  // Markup only: one element carries the scroll class and none sets an inline overflow. That nothing else scrolls is
  // measured in a browser (computed overflow, scrollHeight/clientHeight), see the P7 reports.
  it('markup: only the sheet carries the scroll class, no inline overflow in the dialog', async () => {
    const { dialog } = await enter()
    expect(dialog.querySelectorAll('.hm-score-scroll')).toHaveLength(1)
    const scrolling = [dialog, ...dialog.querySelectorAll<HTMLElement>('*')].filter((el) => /auto|scroll/.test(el.style.overflow + el.style.overflowY))
    expect(scrolling).toEqual([])
  })

  it('wears the dark look only while on', async () => {
    const { sheet } = await loadReady()
    const root = sheet.closest('.hm-score-section')!
    expect(root).not.toHaveClass('hm-score-section--focus')
    fireEvent.click(toggle())
    expect(root).toHaveClass('hm-score-section--focus')
    fireEvent.click(toggle())
    expect(root).not.toHaveClass('hm-score-section--focus')
  })

  it('leaves nothing on the page when the section unmounts in the mode', async () => {
    const { view } = await enter()
    view.unmount()
    expect(document.body.style.overflow).toBe('')
    expect(document.body.className).toBe('')
    expect(document.querySelector('[inert]')).toBeNull()
  })

  it('another file ends the mode with the player that held it', async () => {
    await enter()
    pickBoth(scoreFile('khac.mxl'), audioFile('khac.wav'))
    await waitFor(() => expect(engines).toHaveLength(2))
    await findSheet()
    expect(screen.queryByRole('dialog')).toBeNull()
    await waitFor(() => expect(document.querySelector('[inert]')).toBeNull())
    expect(document.body.style.overflow).toBe('')
  })

  it('a score the viewer refuses ends the mode: the error and the fallback are on the page', async () => {
    mocks.createVerovioEngine.mockImplementationOnce(async () => {
      const engine = fakeEngine()
      engine.load.mockResolvedValue({ svgPages: ['<svg>' + ' '.repeat(MAX_PAGE_CHARS) + '</svg>'], mei: '<mei/>', timemap: TIMEMAP, aliases: new Map() })
      engines.push(engine)
      return engine
    })
    renderSection()
    pickBoth()
    // The mode is turned on with f while the score still loads, then the viewer refuses the pages.
    fireEvent.keyDown(screen.getByRole('status', { name: 'Đang tải bản nhạc' }), { key: 'f' }) // at once: the player is mounted, the refusal comes later
    expect(screen.getByRole('dialog', DIALOG)).toBeInTheDocument()
    await screen.findByRole('button', { name: /Thử lại/ })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByText(FALLBACK)).toBeInTheDocument()
    // inert and the scroll hold are taken off by the mode's effect cleanup, after the error card is on screen: wait for it.
    await waitFor(() => expect(document.querySelector('[inert]')).toBeNull())
    expect(document.body.style.overflow).toBe('')
  })
})

describe('ScorePracticeSection, the follow button', () => {
  it('sits in the toolbar above the sheet, never over it, so it cannot cover the last system', async () => {
    renderSection()
    pickBoth()
    const sheet = await findSheet()
    setAudioDuration(60)
    fireEvent.wheel(sheet, { deltaY: 80 })
    const follow = await screen.findByRole('button', { name: 'Theo dõi nốt đang hát' })
    const toolbar = follow.closest('.hm-score-toolbar')!
    expect(toolbar).not.toBeNull()
    expect(toolbar.contains(screen.getByRole('button', { name: 'Chế độ tập trung' }))).toBe(true)
    expect(sheet.closest('.hm-score-frame')!.contains(follow)).toBe(false)
    expect(follow.closest('[style*="absolute"]')).toBeNull()
  })
})

describe('ScorePracticeSection, states with a next step', () => {
  it('says out loud that the score is being prepared, not only to screen readers', async () => {
    mocks.createVerovioEngine.mockImplementationOnce(() => new Promise(() => {}))
    renderSection()
    pickBoth()
    const loading = await screen.findByRole('status', { name: 'Đang tải bản nhạc' })
    expect(loading).toHaveTextContent('Đang dựng bản nhạc, có thể mất vài giây.')
  })

  it('a refused file says in words what to do next', async () => {
    renderSection()
    pickBoth(scoreFile('bai.pdf'))
    expect(await screen.findByRole('alert')).toHaveTextContent(/Vui lòng chọn lại tệp./)
  })

  it('nothing chosen yet: the picker says what to choose and the fallback stays; no player, no focus button', () => {
    renderSection()
    expect(screen.getByText(/Vui lòng chọn cả hai tệp của cùng một bài/)).toBeInTheDocument()
    expect(screen.getByText(FALLBACK)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Chế độ tập trung' })).toBeNull()
  })
})
