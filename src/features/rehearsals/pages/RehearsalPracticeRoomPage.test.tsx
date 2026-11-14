import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import type { SongMaterial } from '@/features/music-library'
import * as songsApi from '@/features/music-library/api/songsApi'
import { renderPage } from '@/test/renderPage'
import * as rehearsalsApi from '../api/rehearsalsApi'
import type { LoadedScore } from '../score/engine'
import { DevFixtureScoreSource } from '../score/source/DevFixtureScoreSource'
import { ScoreSourceError, type ScorePackage, type ScoreSourceErrorCode } from '../score/source/types'
import { ACTIVE_NOTE_CLASS } from '../score/sync/useScoreSync'
import { RehearsalPracticeRoomPage } from './RehearsalPracticeRoomPage'

const mocks = vi.hoisted(() => ({
  flags: { useDevFixtures: true },
  createVerovioEngine: vi.fn(),
}))
vi.mock('@/config/env', async (importOriginal) => {
  const { env } = await importOriginal<typeof import('@/config/env')>()
  return {
    env: {
      ...env,
      get useDevFixtures() {
        return mocks.flags.useDevFixtures
      },
    },
  }
})
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
  private readonly handlers = new Map<string, Set<() => void>>()
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
    this.paused = false
    this.dispatch('play')
    return Promise.resolve()
  }
  pause() {
    this.paused = true
  }
  removeAttribute() {
    this.src = ''
  }
  load() {}
}

class FakeResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const material = (id: string, kind: SongMaterial['kind'], fileName: string, targetSkillName: string | null = null): SongMaterial => ({
  id,
  kind,
  title: id,
  fileName,
  fileSizeBytes: 1000,
  fileRevision: 1,
  targetSkillId: targetSkillName,
  targetSkillName,
  url: `https://files.example/${fileName}`,
  lyricsText: null,
  createdAt: '2026-11-05T12:00:00Z',
})

const SONG_A = 'Con Bước Lên Bàn Thờ'
const SONG_B = 'Hiệp Lễ Tạ Ơn'
const rehearsal = {
  id: 'r1',
  startAt: '2026-11-20T12:00:00.000Z',
  endAt: '2026-11-20T14:00:00.000Z',
  songs: [
    { songId: 's1', songTitle: SONG_A },
    { songId: 's2', songTitle: SONG_B },
  ],
}
const SVG = '<svg xmlns="http://www.w3.org/2000/svg"><g id="n1" class="note"><path d="M0 0"/></g></svg>'
const TIMEMAP = [
  { tstamp: 0, on: ['n1'] },
  { tstamp: 10000, off: ['n1'] },
]

let engines: { load: ReturnType<typeof vi.fn>; relayout: ReturnType<typeof vi.fn>; dispose: ReturnType<typeof vi.fn> }[]
let packages: ScorePackage[]
let originalObserver: typeof ResizeObserver
let load: MockInstance<DevFixtureScoreSource['load']>
let getPlayback: MockInstance<typeof songsApi.getMaterialPlayback>

const renderRoom = () => renderPage(<RehearsalPracticeRoomPage />, '/director/rehearsals/:rehearsalId', '/director/rehearsals/r1')
const findSheet = () => screen.findByRole('group', { name: 'Bản nhạc' })
const fallbackAudio = (title: string) => screen.queryByLabelText(new RegExp(`^Nghe ${title}`))
const findFallback = (title: string) => screen.findByLabelText(new RegExp(`^Nghe ${title}`))
const lastAudio = () => FakeAudio.instances.at(-1)!
const audioOf = (url: string) => FakeAudio.instances.filter((audio) => audio.src === url)
/** The audio is given its source by an effect, which may run after the DOM the caller waited for. */
const waitForAudio = (url = '/sample.wav') => waitFor(() => expect(audioOf(url)).toHaveLength(1))
const playing = () => FakeAudio.instances.filter((audio) => !audio.paused && audio.src !== '')
const expectAllFreed = () => {
  for (const pack of packages) expect(pack.dispose).toHaveBeenCalled()
  for (const engine of engines) expect(engine.dispose).toHaveBeenCalled()
  expect(FakeAudio.instances.every((audio) => audio.src === '')).toBe(true)
}
const loadRefuses = (code: ScoreSourceErrorCode, message: string) => load.mockRejectedValue(new ScoreSourceError(code, message))

beforeEach(() => {
  engines = []
  packages = []
  mocks.flags.useDevFixtures = true
  mocks.createVerovioEngine.mockReset()
  mocks.createVerovioEngine.mockImplementation(async () => {
    const engine = {
      load: vi.fn(async (): Promise<LoadedScore> => ({ svgPages: [SVG], mei: '<mei/>', timemap: TIMEMAP, aliases: new Map() })),
      relayout: vi.fn(() => [SVG]),
      dispose: vi.fn(),
    }
    engines.push(engine)
    return engine
  })
  FakeAudio.instances = []
  vi.stubGlobal('Audio', FakeAudio)
  originalObserver = window.ResizeObserver
  window.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver
  let nextUrl = 0
  URL.createObjectURL = vi.fn(() => `blob:audio-${(nextUrl += 1)}`)
  URL.revokeObjectURL = vi.fn()
  vi.spyOn(rehearsalsApi, 'getRehearsal').mockResolvedValue(rehearsal)
  vi.spyOn(rehearsalsApi, 'listRecordings').mockResolvedValue([])
  vi.spyOn(songsApi, 'listMaterials').mockImplementation(async (songId) =>
    songId === 's1'
      ? [material('all', 'sampleAudio', 'all.wav'), material('sop', 'sampleAudio', 'sop.wav', 'Soprano')]
      : [material('two', 'sampleAudio', 'two.wav')],
  )
  getPlayback = vi.spyOn(songsApi, 'getMaterialPlayback')
  load = vi.spyOn(DevFixtureScoreSource.prototype, 'load').mockImplementation(async () => {
    const pack: ScorePackage = { score: { data: new Uint8Array([1]), format: 'mxl', fileName: 'sample.mxl' }, audioUrl: '/sample.wav', dispose: vi.fn() }
    packages.push(pack)
    return pack
  })
})

afterEach(() => {
  window.ResizeObserver = originalObserver
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('RehearsalPracticeRoomPage with the score player, one source of sound', () => {
  it('a ready score takes the place of the room audio, so only its clock can sound', async () => {
    renderRoom()
    await findSheet()
    await screen.findByRole('button', { name: `Phát ${SONG_A}` })
    // Materials answer after the sheet may have appeared; whenever they do, the fallback must stay out.
    await waitFor(() => expect(songsApi.listMaterials).toHaveBeenCalledWith('s1'))
    expect(fallbackAudio(SONG_A)).toBeNull()
  })

  it('a ready score never mounts the MIDI player, so its audio is not fetched', async () => {
    vi.mocked(songsApi.listMaterials).mockResolvedValue([material('midi', 'rehearsalMaterial', 'a.mid')])
    renderRoom()
    await findSheet()
    await waitFor(() => expect(songsApi.listMaterials).toHaveBeenCalled())
    await act(async () => {})
    expect(getPlayback).not.toHaveBeenCalled()
  })

  it('with no score source the room audio stays', async () => {
    mocks.flags.useDevFixtures = false
    renderRoom()
    expect(await findFallback(SONG_A)).toBeInTheDocument()
    expect(mocks.createVerovioEngine).not.toHaveBeenCalled()
  })

  it('a file pair picked while the room audio shows replaces it', async () => {
    mocks.flags.useDevFixtures = false
    renderRoom()
    await findFallback(SONG_A)
    fireEvent.change(screen.getByLabelText(/Tệp bản nhạc/), { target: { files: [new File(['xml'], 'bai.musicxml')] } })
    expect(fallbackAudio(SONG_A)).not.toBeNull()
    fireEvent.change(screen.getByLabelText(/Tệp âm thanh/), { target: { files: [new File(['wav'], 'bai.wav')] } })
    await findSheet()
    expect(fallbackAudio(SONG_A)).toBeNull()
  })

  it('an audio that never loads brings the room audio back beside the sheet, with a message', async () => {
    renderRoom()
    await findSheet()
    await waitForAudio()
    await waitFor(() => expect(songsApi.listMaterials).toHaveBeenCalled())
    act(() => audioOf('/sample.wav')[0].dispatch('error'))
    expect(await screen.findByText('Không thể phát âm thanh. Vui lòng thử lại hoặc chọn tệp khác.')).toBeInTheDocument()
    expect(await findFallback(SONG_A)).toBeInTheDocument()
    expect(await findSheet()).toBeInTheDocument()
  })
})

describe('RehearsalPracticeRoomPage with the score player, each source error', () => {
  it.each<[ScoreSourceErrorCode, string]>([
    ['invalid-type', 'Tệp bản nhạc cần có đuôi .musicxml hoặc .mxl.'],
    ['too-large', 'Tệp bản nhạc lớn hơn 20 MB.'],
    ['unavailable', 'Bản nhạc mẫu chỉ dùng khi phát triển.'],
  ])('%s: the source says why, the room audio returns, retrying is not offered', async (code, message) => {
    loadRefuses(code, message)
    renderRoom()
    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(await findFallback(SONG_A)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Thử lại/ })).toBeNull()
    expect(mocks.createVerovioEngine).not.toHaveBeenCalled()
  })

  it.each<[ScoreSourceErrorCode, string]>([
    ['read-failed', 'Không đọc được bản nhạc mẫu.'],
    ['aborted', 'Đã hủy việc mở bản nhạc.'],
  ])('%s: the sheet offers a retry beside the room audio, and the retry loads again', async (code, message) => {
    loadRefuses(code, message)
    renderRoom()
    const retry = await screen.findByRole('button', { name: /Thử lại/ })
    expect(screen.getByText('Không thể hiển thị bản nhạc')).toBeInTheDocument()
    expect(screen.getByText('Đã xảy ra sự cố khi mở bản nhạc. Vui lòng thử lại.')).toBeInTheDocument()
    expect(await findFallback(SONG_A)).toBeInTheDocument()

    load.mockResolvedValue({ score: { data: new Uint8Array([1]), format: 'mxl', fileName: 'sample.mxl' }, audioUrl: '/sample.wav', dispose: vi.fn() })
    fireEvent.click(retry)
    await findSheet()
    expect(fallbackAudio(SONG_A)).toBeNull()
  })
})

describe('RehearsalPracticeRoomPage with the score player, changing and leaving', () => {
  const startPlaying = async () => {
    await findSheet()
    await waitForAudio()
    fireEvent.click(await screen.findByRole('button', { name: /^Phát / }))
    await waitFor(() => expect(playing()).toHaveLength(1))
  }

  it.each([
    ['the next button', () => fireEvent.click(screen.getByRole('button', { name: 'Bài sau' }))],
    ['the song list', () => fireEvent.click(screen.getByRole('button', { name: new RegExp(SONG_B) }))],
  ])('another song by %s frees the first score and starts clean', async (_name, change) => {
    const { container } = renderRoom()
    await startPlaying()
    const first = lastAudio()
    const firstPackages = [...packages]
    const firstEngines = [...engines]
    await waitFor(() => expect(container.querySelector(`.${ACTIVE_NOTE_CLASS}`)).not.toBeNull())

    change()

    await screen.findByRole('heading', { name: SONG_B, level: 2 })
    await screen.findByRole('button', { name: `Phát ${SONG_B}` })
    expect(first.src).toBe('')
    for (const pack of firstPackages) expect(pack.dispose).toHaveBeenCalled()
    for (const engine of firstEngines) expect(engine.dispose).toHaveBeenCalled()
    expect(playing()).toHaveLength(0)
    // The new sheet lights its own first note at time 0; the old sheet and its lit note are gone with it.
    await waitFor(() => expect(container.querySelectorAll(`.${ACTIVE_NOTE_CLASS}`)).toHaveLength(1))
  })

  it('another song forgets a picked pair and revokes its object URL', async () => {
    mocks.flags.useDevFixtures = false
    load.mockRestore()
    renderRoom()
    await findFallback(SONG_A)
    fireEvent.change(screen.getByLabelText(/Tệp bản nhạc/), { target: { files: [new File(['xml'], 'bai.musicxml')] } })
    fireEvent.change(screen.getByLabelText(/Tệp âm thanh/), { target: { files: [new File(['wav'], 'bai.wav')] } })
    await findSheet()
    fireEvent.click(screen.getByRole('button', { name: 'Bài sau' }))
    expect(await findFallback(SONG_B)).toBeInTheDocument()
    const created = vi.mocked(URL.createObjectURL).mock.results.map((result) => result.value as string)
    expect(created.length).toBeGreaterThan(0)
    expect(vi.mocked(URL.revokeObjectURL).mock.calls.map(([url]) => url).toSorted()).toEqual(created.toSorted())
    expect(screen.getByText('Chưa chọn tệp', { selector: `[id$="-score-name"]` })).toBeInTheDocument()
  })

  it('another voice part changes the room audio only: the score is not loaded again and keeps playing', async () => {
    const { container } = renderRoom()
    await startPlaying()
    await screen.findByText('Soprano')
    const sheet = container.querySelector('.hm-score-scroll')
    const callsBefore = load.mock.calls.length
    const enginesBefore = engines.length
    const audio = playing()[0]

    fireEvent.click(screen.getByText('Soprano'))

    await waitFor(() => expect(screen.getByRole('radio', { name: 'Soprano' })).toBeChecked())
    expect(load.mock.calls.length).toBe(callsBefore)
    expect(engines.length).toBe(enginesBefore)
    expect(container.querySelector('.hm-score-scroll')).toBe(sheet)
    expect(audio.paused).toBe(false)
    expect(audio.src).toBe('/sample.wav')
  })

  it('leaving by the schedule link while playing frees everything', async () => {
    renderRoom()
    await startPlaying()
    fireEvent.click(screen.getByText('Lịch tập'))
    expect(await screen.findByTestId('location')).toHaveTextContent('/director/rehearsals')
    // The URL changes on commit; the cleanup of the effects may run after it.
    await waitFor(expectAllFreed)
  })

  it('leaving in focus mode while playing gives the page back and frees everything', async () => {
    const view = renderRoom()
    await startPlaying()
    const dialog = view.container.querySelector('dialog')!
    fireEvent.keyDown(dialog, { key: 'f' })
    await waitFor(() => expect(document.body.style.overflow).toBe('hidden'))
    expect(document.querySelectorAll('[inert]').length).toBeGreaterThan(0)
    const remove = vi.spyOn(dialog, 'removeEventListener')

    view.unmount()

    await waitFor(() => {
      expect(document.body.style.overflow).toBe('')
      expect(document.querySelectorAll('[inert]')).toHaveLength(0)
      expect(remove.mock.calls.some(([type]) => type === 'keydown')).toBe(true)
      expectAllFreed()
    })
  })
})
