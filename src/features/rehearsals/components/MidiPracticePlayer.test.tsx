import { Profiler, type ProfilerOnRenderCallback } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MidiPracticePlayer } from './MidiPracticePlayer'

const mocks = vi.hoisted(() => ({
  useMaterialPlayback: vi.fn(),
}))

vi.mock('@/features/music-library', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/music-library')>()
  return { ...actual, useMaterialPlayback: mocks.useMaterialPlayback }
})

class FakeAudio {
  static instances: FakeAudio[] = []
  static playError: Error | null = null

  private time = 0
  duration = Number.NaN
  ended = false
  paused = true
  preload = ''
  src = ''
  pauseCalls = 0
  private handlers = new Map<string, Set<EventListenerOrEventListenerObject>>()

  get currentTime() {
    return this.time
  }

  set currentTime(value: number) {
    const max = Number.isFinite(this.duration) ? this.duration : Number.POSITIVE_INFINITY
    this.time = Math.min(Math.max(value, 0), max)
  }

  constructor() {
    FakeAudio.instances.push(this)
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set())
    this.handlers.get(type)!.add(listener)
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    this.handlers.get(type)?.delete(listener)
  }

  dispatch(type: string) {
    const event = new Event(type)
    for (const listener of [...(this.handlers.get(type) ?? [])]) {
      if (typeof listener === 'function') listener(event)
      else listener.handleEvent(event)
    }
  }

  play() {
    if (FakeAudio.playError) return Promise.reject(FakeAudio.playError)
    this.paused = false
    this.ended = false
    this.dispatch('play')
    return Promise.resolve()
  }

  pause() {
    this.pauseCalls += 1
    if (this.paused) return
    this.paused = true
    this.dispatch('pause')
  }

  removeAttribute(name: string) {
    if (name === 'src') this.src = ''
  }

  load() {}

  get listenerCount() {
    return [...this.handlers.values()].reduce((count, listeners) => count + listeners.size, 0)
  }
}

const raf = {
  nextId: 1,
  pending: new Map<number, FrameRequestCallback>(),
  frame() {
    const batch = [...this.pending.entries()]
    this.pending.clear()
    for (const [, callback] of batch) callback(0)
  },
}

const score = {
  schemaVersion: 1 as const,
  timeUnit: 'seconds' as const,
  durationSeconds: 12,
  notesEndSeconds: 8,
  minPitch: 60,
  maxPitch: 64,
  tracks: [{ id: 0, name: 'Piano' }],
  notes: [
    { pitch: 60, start: 0, duration: 1, velocity: 96, track: 0 },
    { pitch: 64, start: 2, duration: 1.5, velocity: 88, track: 0 },
  ],
}

const clearRect = vi.fn()
const context = {
  beginPath: vi.fn(),
  clearRect,
  fillRect: vi.fn(),
  fillText: vi.fn(),
  lineTo: vi.fn(),
  moveTo: vi.fn(),
  setTransform: vi.fn(),
  stroke: vi.fn(),
  strokeRect: vi.fn(),
} as unknown as CanvasRenderingContext2D

function playbackResult(audioUrl = 'https://files.example/kyrie.wav') {
  return {
    data: {
      playback: {
        id: 'playback-1',
        songId: 'song-1',
        title: 'Kyrie',
        status: 'ready',
        schemaVersion: 1,
        durationSeconds: 12,
        instrument: 'piano',
        audioUrl,
        notesUrl: 'https://files.example/kyrie.notes.json',
        createdAt: '2026-11-07T00:00:00Z',
      },
      notes: score,
    },
    isPending: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
  }
}

function renderPlayer(onRender?: ProfilerOnRenderCallback) {
  mocks.useMaterialPlayback.mockReturnValue(playbackResult())
  const player = <MidiPracticePlayer materialId="material-1" title="Kyrie" />
  return render(onRender ? <Profiler id="midi-player" onRender={onRender}>{player}</Profiler> : player)
}

const audio = () => FakeAudio.instances.at(-1)!

beforeEach(() => {
  vi.clearAllMocks()
  FakeAudio.instances = []
  FakeAudio.playError = null
  raf.nextId = 1
  raf.pending.clear()
  vi.stubGlobal('Audio', FakeAudio)
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    const id = raf.nextId++
    raf.pending.set(id, callback)
    return id
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => raf.pending.delete(id))
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => context)

  const createElement = document.createElement.bind(document)
  vi.spyOn(document, 'createElement').mockImplementation(((tagName: string, options?: ElementCreationOptions) => {
    if (tagName.toLowerCase() === 'audio') return new FakeAudio() as unknown as HTMLAudioElement
    return createElement(tagName, options)
  }) as typeof document.createElement)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('MidiPracticePlayer synchronized playback', () => {
  it('renders title and play button', () => {
    renderPlayer()

    expect(screen.getByRole('heading', { level: 3, name: 'Bản nốt đồng bộ' })).toBeInTheDocument()
    expect(screen.getByText('2 nốt · 1 track')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Phát Kyrie' })).toBeInTheDocument()
  })

  it('toggle calls audio play and pause', async () => {
    renderPlayer()

    fireEvent.click(screen.getByRole('button', { name: 'Phát Kyrie' }))
    expect(await screen.findByRole('button', { name: 'Tạm dừng Kyrie' })).toBeInTheDocument()
    expect(audio().paused).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: 'Tạm dừng Kyrie' }))
    expect(screen.getByRole('button', { name: 'Phát Kyrie' })).toBeInTheDocument()
    expect(audio().paused).toBe(true)
    expect(audio().pauseCalls).toBe(1)
  })

  it('seeking via the Ant Design Slider updates audio time', () => {
    renderPlayer()
    act(() => {
      audio().duration = 12
      audio().dispatch('loadedmetadata')
    })

    const slider = screen.getByRole('slider')
    for (let step = 0; step < 100; step += 1) {
      fireEvent.keyDown(slider, { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39, which: 39 })
    }

    expect(audio().currentTime).toBeCloseTo(1)
    expect(screen.getByText('0:01 / 0:12')).toBeInTheDocument()
  })

  it('replay after ended starts from 0', async () => {
    renderPlayer()
    act(() => {
      audio().duration = 8
      audio().dispatch('loadedmetadata')
    })
    fireEvent.click(screen.getByRole('button', { name: 'Phát Kyrie' }))
    expect(await screen.findByRole('button', { name: 'Tạm dừng Kyrie' })).toBeInTheDocument()

    act(() => {
      // The real audio may end before the 12-second score/fallback duration.
      audio().currentTime = 8
      audio().paused = true
      audio().ended = true
      audio().dispatch('ended')
    })
    fireEvent.click(screen.getByRole('button', { name: 'Phát Kyrie' }))

    expect(audio().currentTime).toBe(0)
    expect(await screen.findByRole('button', { name: 'Tạm dừng Kyrie' })).toBeInTheDocument()
  })

  it('locks playback with the legacy warning when audio loading fails', () => {
    renderPlayer()

    act(() => audio().dispatch('error'))

    expect(screen.getByRole('alert')).toHaveTextContent('Không thể phát bản MIDI. Vui lòng tải lại bản phát rồi thử lại.')
    expect(screen.getByRole('button', { name: 'Phát Kyrie' })).toBeDisabled()
  })

  it('locks playback with the legacy warning when play is rejected', async () => {
    FakeAudio.playError = new Error('NotAllowedError')
    renderPlayer()

    fireEvent.click(screen.getByRole('button', { name: 'Phát Kyrie' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể phát bản MIDI. Vui lòng tải lại bản phát rồi thử lại.')
    expect(screen.getByRole('button', { name: 'Phát Kyrie' })).toBeDisabled()
  })

  it('draws every frame without re-rendering every frame', async () => {
    const onRender = vi.fn<ProfilerOnRenderCallback>()
    renderPlayer(onRender)
    fireEvent.click(screen.getByRole('button', { name: 'Phát Kyrie' }))
    expect(await screen.findByRole('button', { name: 'Tạm dừng Kyrie' })).toBeInTheDocument()
    const rendersBeforeFrames = onRender.mock.calls.length
    const drawsBeforeFrames = clearRect.mock.calls.length

    for (let frame = 1; frame <= 60; frame += 1) {
      audio().currentTime = frame / 100
      act(() => raf.frame())
    }

    expect(onRender.mock.calls.length - rendersBeforeFrames).toBeLessThanOrEqual(1)
    expect(clearRect.mock.calls.length - drawsBeforeFrames).toBeGreaterThanOrEqual(60)
  })

  it('changing audio releases the old clock and resets time and Slider', () => {
    const view = renderPlayer()
    act(() => {
      audio().duration = 12
      audio().dispatch('loadedmetadata')
    })
    const slider = screen.getByRole('slider')
    for (let step = 0; step < 100; step += 1) {
      fireEvent.keyDown(slider, { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39, which: 39 })
    }
    const previousAudio = audio()
    expect(screen.getByText('0:01 / 0:12')).toBeInTheDocument()

    mocks.useMaterialPlayback.mockReturnValue(playbackResult('https://files.example/agnus-dei.wav'))
    view.rerender(<MidiPracticePlayer materialId="material-1" title="Kyrie" />)

    expect(FakeAudio.instances).toHaveLength(2)
    expect(audio()).not.toBe(previousAudio)
    expect(previousAudio.paused).toBe(true)
    expect(previousAudio.pauseCalls).toBe(1)
    expect(previousAudio.listenerCount).toBe(0)
    expect(previousAudio.src).toBe('')
    expect(audio().currentTime).toBe(0)
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '0')
    expect(screen.getByText('0:00 / 0:12')).toBeInTheDocument()
  })

  it('unmount stops audio, removes listeners and cancels the frame loop', async () => {
    const view = renderPlayer()
    fireEvent.click(screen.getByRole('button', { name: 'Phát Kyrie' }))
    expect(await screen.findByRole('button', { name: 'Tạm dừng Kyrie' })).toBeInTheDocument()
    const instance = audio()
    expect(raf.pending.size).toBe(1)

    view.unmount()

    expect(instance.paused).toBe(true)
    expect(instance.pauseCalls).toBe(1)
    expect(instance.listenerCount).toBe(0)
    expect(raf.pending.size).toBe(0)
  })
})
