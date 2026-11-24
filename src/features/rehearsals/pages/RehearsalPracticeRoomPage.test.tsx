import { useQueryClient } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { useState } from 'react'
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router'
import { AppProviders } from '@/app/providers'
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import * as choirsApi from '@/features/choirs/api/choirsApi'
import type { SongMaterial } from '@/features/music-library'
import * as songsApi from '@/features/music-library/api/songsApi'
import { ApiError } from '@/lib/api/errors'
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
// The PDF viewer loads pdf.js, which jsdom cannot run; the drawer around it is what these tests check.
vi.mock('../components/PracticeScoreViewer', () => ({
  PracticeScoreViewer: ({ songTitle }: { songTitle: string }) => <p>Trình xem bản nhạc {songTitle}</p>,
}))
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
const chooseSong = async (title: string) => {
  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Bài hát đang tập' }))
  fireEvent.click(await screen.findByTitle(new RegExp(title)))
}
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

  it('choosing another song stops the first, then reuses its cached score when returning', async () => {
    const view = renderRoom()
    const { container } = view
    await startPlaying()
    const first = lastAudio()
    const firstPackage = packages.at(-1)!
    const firstEngine = engines.at(-1)!
    await waitFor(() => expect(container.querySelector(`.${ACTIVE_NOTE_CLASS}`)).not.toBeNull())

    await chooseSong(SONG_B)

    await screen.findByRole('heading', { name: SONG_B, level: 1 })
    await screen.findByRole('button', { name: `Phát ${SONG_B}` })
    expect(first.src).toBe('')
    expect(firstPackage.dispose).not.toHaveBeenCalled()
    expect(firstEngine.dispose).not.toHaveBeenCalled()
    expect(playing()).toHaveLength(0)
    // The new sheet lights its own first note at time 0; the old sheet and its lit note are gone with it.
    await waitFor(() => expect(container.querySelectorAll(`.${ACTIVE_NOTE_CLASS}`)).toHaveLength(1))

    const loadsBeforeReturn = load.mock.calls.length
    const enginesBeforeReturn = engines.length
    await chooseSong(SONG_A)
    await screen.findByRole('heading', { name: SONG_A, level: 1 })
    await screen.findByRole('button', { name: `Phát ${SONG_A}` })
    expect(load.mock.calls.length).toBe(loadsBeforeReturn)
    expect(engines).toHaveLength(enginesBeforeReturn)

    view.unmount()
    expectAllFreed()
  })

  it('keeps at most three idle scores cached across songs and evicts the oldest one', async () => {
    const fiveSongs = [
      { songId: 's1', songTitle: SONG_A },
      { songId: 's2', songTitle: SONG_B },
      { songId: 's3', songTitle: 'Ca Nhập Lễ' },
      { songId: 's4', songTitle: 'Đáp Ca' },
      { songId: 's5', songTitle: 'Kết Lễ' },
    ]
    vi.mocked(rehearsalsApi.getRehearsal).mockResolvedValue({ ...rehearsal, songs: fiveSongs })
    const view = renderRoom()
    await findSheet()
    await screen.findByRole('button', { name: `Phát ${SONG_A}` })
    fireEvent.click(screen.getByText('Lớn'))

    const songPackages: ScorePackage[] = [packages.at(-1)!]
    for (const next of fiveSongs.slice(1, 4)) {
      await chooseSong(next.songTitle)
      await screen.findByRole('button', { name: `Phát ${next.songTitle}` })
      songPackages.push(packages.at(-1)!)
    }
    // Songs 1, 2, 3 are idle in cache (3 idle + Song 4 active): Song 1 is not disposed yet.
    expect(engines[0].dispose).not.toHaveBeenCalled()
    expect(songPackages[0].dispose).not.toHaveBeenCalled()

    // Returning to Song 1 reuses its cached engine and keeps its chosen notation size.
    await chooseSong(SONG_A)
    await screen.findByRole('button', { name: `Phát ${SONG_A}` })
    expect(screen.getByRole('radio', { name: 'Lớn' })).toBeChecked()
    expect(engines).toHaveLength(4)

    // Visiting Song 5 now puts Song 1 into the cache (idle: 2, 3, 1); Song 2 is oldest when Song 4 is left out.
    await chooseSong('Kết Lễ')
    await screen.findByRole('button', { name: 'Phát Kết Lễ' })
    expect(engines[1].dispose).toHaveBeenCalledTimes(1)
    expect(songPackages[1].dispose).toHaveBeenCalledTimes(1)

    view.unmount()
    expectAllFreed()
  })

  it('another song forgets a picked pair and revokes its object URL', async () => {
    mocks.flags.useDevFixtures = false
    load.mockRestore()
    renderRoom()
    await findFallback(SONG_A)
    fireEvent.change(screen.getByLabelText(/Tệp bản nhạc/), { target: { files: [new File(['xml'], 'bai.musicxml')] } })
    fireEvent.change(screen.getByLabelText(/Tệp âm thanh/), { target: { files: [new File(['wav'], 'bai.wav')] } })
    await findSheet()
    await chooseSong(SONG_B)
    expect(await findFallback(SONG_B)).toBeInTheDocument()
    const created = vi.mocked(URL.createObjectURL).mock.results.map((result) => result.value as string)
    expect(created.length).toBeGreaterThan(0)
    expect(vi.mocked(URL.revokeObjectURL).mock.calls.map(([url]) => url).toSorted()).toEqual(created.toSorted())
    expect(screen.getByText('Chưa chọn tệp', { selector: `[id$="-score-name"]` })).toBeInTheDocument()
  })

  it('another voice part changes the room audio only: the score is not loaded again and keeps playing', async () => {
    const { container } = renderRoom()
    await startPlaying()
    await screen.findByText('Nữ cao')
    const sheet = container.querySelector('.hm-score-scroll')
    const callsBefore = load.mock.calls.length
    const enginesBefore = engines.length
    const audio = playing()[0]

    fireEvent.click(screen.getByText('Nữ cao'))

    await waitFor(() => expect(screen.getByRole('radio', { name: 'Nữ cao' })).toBeChecked())
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

  it('the transport says it is playing in words, not by the icon alone', async () => {
    renderRoom()
    await startPlaying()
    expect(await screen.findByText('Đang phát')).toBeInTheDocument()
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

const never = <T,>() => new Promise<T>(() => {})
/** The room with no score source: the fallback player (or its loading and empty states) is what shows. */
const renderPlainRoom = () => {
  mocks.flags.useDevFixtures = false
  return renderRoom()
}

describe('RehearsalPracticeRoomPage page states', () => {
  it('while the rehearsal loads, shows the page skeleton', async () => {
    vi.mocked(rehearsalsApi.getRehearsal).mockReturnValue(never())
    renderRoom()
    expect(await screen.findByRole('status', { name: 'Đang tải trang' })).toBeInTheDocument()
  })

  it('a rehearsal that does not exist (404) says so under the room title and leads back to the schedule', async () => {
    vi.mocked(rehearsalsApi.getRehearsal).mockRejectedValue(new ApiError(404, { code: 'REHEARSAL_NOT_FOUND' }))
    renderRoom()
    expect(await screen.findByRole('heading', { name: 'Không tìm thấy buổi tập' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Phòng luyện tập', level: 1 })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Quay lại lịch tập' }))
    expect(await screen.findByTestId('location')).toHaveTextContent('/director/rehearsals')
  })

  it('another failure offers a retry, and the retry opens the room', async () => {
    vi.mocked(rehearsalsApi.getRehearsal).mockRejectedValueOnce(new ApiError(403, { code: 'FORBIDDEN' }))
    renderPlainRoom()
    expect(await screen.findByRole('heading', { name: 'Không thể tải buổi tập' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Phòng luyện tập', level: 1 })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Thử lại/ }))
    expect(await screen.findByRole('heading', { name: SONG_A, level: 1 })).toBeInTheDocument()
  })

  it('a rehearsal without songs says so instead of a player', async () => {
    vi.mocked(rehearsalsApi.getRehearsal).mockResolvedValue({ ...rehearsal, songs: [] })
    renderRoom()
    expect(await screen.findByRole('heading', { name: 'Buổi tập chưa có bài hát' })).toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: 'Bài hát đang tập' })).toBeNull()
  })

  it('while the materials load, shows a section skeleton', async () => {
    vi.mocked(songsApi.listMaterials).mockReturnValue(never())
    renderPlainRoom()
    expect(await screen.findByRole('status', { name: 'Đang tải tài liệu tập' })).toBeInTheDocument()
  })

  it('a song with no audio or MIDI says so and links to its song page', async () => {
    vi.mocked(songsApi.listMaterials).mockResolvedValue([])
    renderPlainRoom()
    expect(await screen.findByRole('heading', { name: 'Chưa có audio mẫu hoặc MIDI', level: 3 })).toBeInTheDocument()
    expect(screen.getByText('Chưa có audio mẫu')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Mở chi tiết bài hát' }))
    expect(await screen.findByTestId('location')).toHaveTextContent('/director/library/s1')
  })

  it('a voice part without its own audio keeps the general audio, named as the song', async () => {
    vi.mocked(songsApi.listMaterials).mockResolvedValue([
      material('all', 'sampleAudio', 'all.wav'),
      material('ten', 'sheetMusic', 'tenor.pdf', 'Tenor'),
    ])
    renderPlainRoom()
    await findFallback(SONG_A)
    fireEvent.click(await screen.findByText('Nam cao'))
    expect(await screen.findByText('Bè: Nam cao')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Chưa có audio mẫu hoặc MIDI' })).toBeNull()
    expect(fallbackAudio(SONG_A)).toBeInTheDocument()
    expect(screen.queryByLabelText(/bè Tenor/)).toBeNull()
    expect(screen.getByText('Audio mẫu')).toBeInTheDocument()
  })
})

describe('RehearsalPracticeRoomPage console', () => {
  it('steps through the songs, disabled at both ends', async () => {
    renderPlainRoom()
    await findFallback(SONG_A)
    const previous = screen.getByRole('button', { name: 'Bài hát trước' })
    const next = screen.getByRole('button', { name: 'Bài hát sau' })
    expect(previous).toBeDisabled()
    fireEvent.click(next)
    expect(await screen.findByRole('heading', { name: SONG_B, level: 1 })).toBeInTheDocument()
    expect(next).toBeDisabled()
    fireEvent.click(previous)
    expect(await screen.findByRole('heading', { name: SONG_A, level: 1 })).toBeInTheDocument()
  })

  it('opens the song list beside its field, not at the end of the page', async () => {
    renderPlainRoom()
    await findFallback(SONG_A)
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Bài hát đang tập' }))
    expect((await screen.findByTitle(new RegExp(SONG_B))).closest('.hm-sheet-section')).not.toBeNull()
  })

  it('reads out what plays and for which part', async () => {
    renderPlainRoom()
    await findFallback(SONG_A)
    expect(screen.getByText('Audio mẫu')).toBeInTheDocument()
    expect(screen.getByText('Bè: Tất cả')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Nữ cao'))
    expect(await screen.findByText('Bè: Nữ cao')).toBeInTheDocument()
  })

  it('"Tài liệu" is off while the song has no score', async () => {
    renderPlainRoom()
    await findFallback(SONG_A)
    expect(screen.getByRole('button', { name: 'Tài liệu' })).toBeDisabled()
  })

  it('"Tài liệu" opens a drawer of the same name with the song', async () => {
    vi.mocked(songsApi.listMaterials).mockResolvedValue([material('all', 'sampleAudio', 'all.wav'), material('pdf', 'sheetMusic', 'score.pdf')])
    renderPlainRoom()
    await findFallback(SONG_A)
    fireEvent.click(screen.getByRole('button', { name: 'Tài liệu' }))
    const drawer = await screen.findByRole('dialog')
    expect(within(drawer).getByText('Tài liệu')).toBeInTheDocument()
    expect(await within(drawer).findByText(`Trình xem bản nhạc ${SONG_A}`)).toBeInTheDocument()
  })

  it('"Ghi âm" opens a drawer of the same name, and loads the takes before saying there are none', async () => {
    let answer: (value: Awaited<ReturnType<typeof rehearsalsApi.listRecordings>>) => void = () => {}
    vi.mocked(rehearsalsApi.listRecordings).mockReturnValue(new Promise((resolve) => (answer = resolve)))
    renderPlainRoom()
    await findFallback(SONG_A)
    fireEvent.click(screen.getByRole('button', { name: 'Ghi âm' }))
    const drawer = await screen.findByRole('dialog')
    expect(within(drawer).getByText('Ghi âm')).toBeInTheDocument()
    expect(within(drawer).getByText(SONG_A)).toBeInTheDocument()
    expect(await within(drawer).findByRole('status', { name: 'Đang tải bản thu' })).toBeInTheDocument()
    expect(within(drawer).queryByText('Chưa có bản thu nào cho bài hát này')).toBeNull()

    await act(async () => answer([]))
    expect(await within(drawer).findByRole('heading', { name: 'Chưa có bản thu nào cho bài hát này', level: 3 })).toBeInTheDocument()
    expect(within(drawer).getByText(/nghe lại các bản thu này trên ứng dụng di động/)).toBeInTheDocument()
    expect(within(drawer).queryByRole('status', { name: 'Đang tải bản thu' })).toBeNull()
  })
})

describe('RehearsalPracticeRoomPage cross-links', () => {
  const renderFromSchedule = (eventId?: string) => {
    mocks.flags.useDevFixtures = false
    // The schedule list (RehearsalDto) knows the program; the detail endpoint the room reads again does not.
    return renderPage(<RehearsalPracticeRoomPage />, '/director/rehearsals/:rehearsalId', {
      pathname: '/director/rehearsals/r1',
      state: { rehearsal: { ...rehearsal, eventId } },
    })
  }

  it('links the active song to its song page', async () => {
    renderFromSchedule()
    await findFallback(SONG_A)
    expect(screen.getByRole('link', { name: 'Chi tiết bài hát' })).toHaveAttribute('href', '/director/library/s1')
  })

  it('links the program the rehearsal prepares, kept from the schedule after the detail answers', async () => {
    renderFromSchedule('e1')
    await findFallback(SONG_A)
    await waitFor(() => expect(rehearsalsApi.getRehearsal).toHaveBeenCalledWith('r1'))
    expect(screen.getByRole('link', { name: 'Xem chương trình' })).toHaveAttribute('href', '/director/programs/e1')
  })

  it('shows no program link when the rehearsal prepares none', async () => {
    renderFromSchedule()
    await findFallback(SONG_A)
    expect(screen.queryByRole('link', { name: 'Xem chương trình' })).toBeNull()
  })

  it('"Điểm danh" opens the attendance page', async () => {
    renderFromSchedule('e1')
    await findFallback(SONG_A)
    fireEvent.click(screen.getByRole('button', { name: 'Điểm danh' }))
    expect(await screen.findByTestId('location')).toHaveTextContent('/director/attendance')
  })

  it('opened without router state, finds the program in a schedule list already loaded, without asking for one', async () => {
    mocks.flags.useDevFixtures = false
    const list = vi.spyOn(rehearsalsApi, 'listRehearsals')
    // Stands for the schedule page the director came from: its list is in the cache, the room asks nothing more.
    function SeededRoom() {
      const queryClient = useQueryClient()
      useState(() =>
        queryClient.setQueryData(['rehearsals', 'list', {}, { pageNumber: 1, pageSize: 20 }], {
          items: [{ ...rehearsal, eventId: 'e1' }],
          pageNumber: 1,
          pageSize: 20,
          totalCount: 1,
          totalPages: 1,
        }),
      )
      return <RehearsalPracticeRoomPage />
    }
    renderPage(<SeededRoom />, '/director/rehearsals/:rehearsalId', '/director/rehearsals/r1')
    await findFallback(SONG_A)
    await waitFor(() => expect(rehearsalsApi.getRehearsal).toHaveBeenCalledWith('r1'))
    expect(screen.getByRole('link', { name: 'Xem chương trình' })).toHaveAttribute('href', '/director/programs/e1')
    expect(list).not.toHaveBeenCalled()
  })
})

describe('RehearsalPracticeRoomPage joint rehearsal', () => {
  const renderJoint = () => {
    mocks.flags.useDevFixtures = false
    vi.mocked(rehearsalsApi.getRehearsal).mockResolvedValue({ ...rehearsal, isJoint: true })
    return renderPage(<RehearsalPracticeRoomPage />, '/director/rehearsals/:rehearsalId', {
      pathname: '/director/rehearsals/r1',
      state: { rehearsal: { ...rehearsal, isJoint: true, eventId: 'e1' } },
    })
  }

  const oneTake = () =>
    vi.mocked(rehearsalsApi.listRecordings).mockResolvedValue([
      { id: 't1', songId: 's1', fileSizeBytes: 1000, audioUrl: 'https://files.example/t1.webm', createdAt: '2026-11-20T10:00:00Z' },
    ])

  it('leaves attendance, recording and deleting to the lead choir director, and lets the others listen', async () => {
    const choirs = vi
      .spyOn(choirsApi, 'listEventChoirs')
      .mockResolvedValue([{ choirId: 'c9', name: 'Ca đoàn Cecilia', isActive: true, isLead: true, directorId: 'someone-else', substituteDirectorId: 'another' }])
    oneTake()
    renderJoint()
    await findFallback(SONG_A)
    await waitFor(() => expect(choirs).toHaveBeenCalledWith('e1'))
    // Attendance and recording go through CheckCanManageRehearsalAsync; listening through CanViewAsync (every serving choir).
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Điểm danh' })).toBeNull())
    expect(screen.getByRole('button', { name: 'Hiện lời' })).toBeInTheDocument()
    expect(screen.getByText('Buổi tập chung')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Ghi âm' }))
    const drawer = await screen.findByRole('dialog')
    expect(await within(drawer).findByLabelText(`Nghe bản thu 1 của ${SONG_A}`)).toBeInTheDocument()
    expect(within(drawer).queryByRole('button', { name: 'Thu âm' })).toBeNull()
    expect(within(drawer).queryByRole('button', { name: /^Xoá bản thu/ })).toBeNull()
  })

  it('keeps attendance, recording and deleting for the director who plans it', async () => {
    const choirs = vi.spyOn(choirsApi, 'listEventChoirs').mockResolvedValue([])
    oneTake()
    renderJoint()
    await findFallback(SONG_A)
    await waitFor(() => expect(choirs).toHaveBeenCalledWith('e1'))
    await act(async () => {})
    expect(screen.getByRole('button', { name: 'Điểm danh' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Ghi âm' }))
    const drawer = await screen.findByRole('dialog')
    expect(await within(drawer).findByRole('button', { name: `Xoá bản thu 1 của ${SONG_A}` })).toBeInTheDocument()
    expect(within(drawer).getByRole('button', { name: 'Thu âm' })).toBeInTheDocument()
  })
})

describe('RehearsalPracticeRoomPage attendance link', () => {
  it('"Điểm danh" opens the attendance sheet of this rehearsal and its program', async () => {
    mocks.flags.useDevFixtures = false
    // renderPage's probe shows the path only; this router keeps the query string the attendance page reads.
    function AttendanceProbe() {
      const { pathname, search } = useLocation()
      return <p data-testid="attendance-url">{`${pathname}${search}`}</p>
    }
    const router = createMemoryRouter(
      [
        { path: '/director/rehearsals/:rehearsalId', element: <RehearsalPracticeRoomPage /> },
        { path: '/director/attendance', element: <AttendanceProbe /> },
      ],
      { initialEntries: [{ pathname: '/director/rehearsals/r1', state: { rehearsal: { ...rehearsal, eventId: 'e1' } } }] },
    )
    render(
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>,
    )
    await findFallback(SONG_A)
    fireEvent.click(screen.getByRole('button', { name: 'Điểm danh' }))
    expect(await screen.findByTestId('attendance-url')).toHaveTextContent('/director/attendance?rehearsalId=r1&programId=e1')
  })
})
