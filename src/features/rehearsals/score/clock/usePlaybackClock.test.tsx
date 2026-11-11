import { StrictMode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePlaybackClock } from './usePlaybackClock'

// jsdom cannot play audio, so the hook runs against this hand-written stand-in for HTMLAudioElement.
class FakeAudio {
  static instances: FakeAudio[] = []
  static playError: Error | null = null

  private time = 0
  duration = NaN
  ended = false
  paused = true
  src = ''
  preload = ''
  pauseCalls = 0
  srcRemoved = false
  loadCalls = 0
  adds: Record<string, number> = {}
  removes: Record<string, number> = {}
  private handlers = new Map<string, Set<() => void>>()

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

  addEventListener(type: string, fn: () => void) {
    this.adds[type] = (this.adds[type] ?? 0) + 1
    if (!this.handlers.has(type)) this.handlers.set(type, new Set())
    this.handlers.get(type)!.add(fn)
  }

  removeEventListener(type: string, fn: () => void) {
    this.removes[type] = (this.removes[type] ?? 0) + 1
    this.handlers.get(type)?.delete(fn)
  }

  dispatch(type: string) {
    for (const fn of [...(this.handlers.get(type) ?? [])]) fn()
  }

  get listenerCount() {
    return [...this.handlers.values()].reduce((n, set) => n + set.size, 0)
  }

  play() {
    if (FakeAudio.playError) return Promise.reject(FakeAudio.playError)
    this.paused = false
    this.dispatch('play')
    return Promise.resolve()
  }

  pause() {
    this.pauseCalls++
    if (this.paused) return
    this.paused = true
    this.dispatch('pause')
  }

  removeAttribute(name: string) {
    if (name === 'src') this.srcRemoved = true
  }

  load() {
    this.loadCalls++
  }

  get released() {
    return this.pauseCalls > 0 && this.srcRemoved && this.loadCalls > 0
  }
}

// requestAnimationFrame stand-in: frames only run when the test calls frame().
const raf = {
  nextId: 1,
  pending: new Map<number, FrameRequestCallback>(),
  frame() {
    const batch = [...this.pending.entries()]
    this.pending.clear()
    for (const [, cb] of batch) cb(0)
  },
}

const docAdds: Record<string, number> = {}
const docRemoves: Record<string, number> = {}

const live = () => FakeAudio.instances.filter((a) => !a.released)
const last = () => FakeAudio.instances[FakeAudio.instances.length - 1]

const setup = (src: string | undefined, strict = false) =>
  renderHook(({ s }) => usePlaybackClock(s), {
    initialProps: { s: src },
    ...(strict ? { wrapper: StrictMode } : {}),
  })

// jsdom always reports 'visible'; override per test (null removes the override).
const setVisibility = (state: 'hidden' | 'visible' | null) => {
  if (state === null) delete (document as { visibilityState?: string }).visibilityState
  else Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state })
}

const expectBalanced = (audio: FakeAudio) => {
  expect(audio.listenerCount).toBe(0)
  for (const type of Object.keys(audio.adds)) expect(audio.removes[type]).toBe(audio.adds[type])
}

beforeEach(() => {
  FakeAudio.instances = []
  FakeAudio.playError = null
  raf.nextId = 1
  raf.pending.clear()
  vi.stubGlobal('Audio', FakeAudio)
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    const id = raf.nextId++
    raf.pending.set(id, cb)
    return id
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => raf.pending.delete(id))
  for (const k of Object.keys(docAdds)) delete docAdds[k]
  for (const k of Object.keys(docRemoves)) delete docRemoves[k]
  const add = document.addEventListener.bind(document)
  const remove = document.removeEventListener.bind(document)
  vi.spyOn(document, 'addEventListener').mockImplementation(
    (t: string, l: EventListenerOrEventListenerObject, o?: boolean | AddEventListenerOptions) => {
      docAdds[t] = (docAdds[t] ?? 0) + 1
      add(t, l, o)
    },
  )
  vi.spyOn(document, 'removeEventListener').mockImplementation(
    (t: string, l: EventListenerOrEventListenerObject, o?: boolean | EventListenerOptions) => {
      docRemoves[t] = (docRemoves[t] ?? 0) + 1
      remove(t, l, o)
    },
  )
})

afterEach(() => {
  setVisibility(null)
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('usePlaybackClock', () => {
  it('play and pause: subscribers get audio.currentTime each frame, nothing after pause', async () => {
    const { result } = setup('a.wav')
    const seen: number[] = []
    act(() => void result.current.subscribe((t) => seen.push(t)))
    seen.length = 0

    await act(async () => result.current.play())
    expect(result.current.playing).toBe(true)
    expect(raf.pending.size).toBe(1)

    last().currentTime = 1.5
    act(() => raf.frame())
    last().currentTime = 2.25
    act(() => raf.frame())
    expect(seen).toEqual([1.5, 2.25])
    expect(result.current.getTime()).toBe(2.25)

    act(() => result.current.pause())
    expect(result.current.playing).toBe(false)
    expect(raf.pending.size).toBe(0)
    act(() => raf.frame())
    expect(seen).toEqual([1.5, 2.25])
  })

  it('a retry that plays after a rejected play() clears the error', async () => {
    FakeAudio.playError = new Error('NotAllowedError')
    const { result } = setup('a.wav')
    await act(async () => result.current.play())
    expect(result.current.error).not.toBeNull()

    FakeAudio.playError = null
    await act(async () => result.current.play())
    expect(result.current.playing).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('play rejection sets error, playing false and leaves no frame pending', async () => {
    FakeAudio.playError = new Error('NotAllowedError')
    const { result } = setup('a.wav')
    await act(async () => result.current.play())
    expect(result.current.error).toBe('playback-failed')
    expect(result.current.playing).toBe(false)
    expect(raf.pending.size).toBe(0)
  })

  it('audio error sets the neutral playback-failed code', () => {
    const { result } = setup('a.wav')

    act(() => last().dispatch('error'))

    expect(result.current.error).toBe('playback-failed')
  })

  it('sourceFailed: only the audio element failing sets it, not a refused play()', async () => {
    FakeAudio.playError = new Error('NotAllowedError')
    const { result } = setup('a.wav')
    expect(result.current.sourceFailed).toBe(false)

    await act(async () => result.current.play())
    expect(result.current.error).toBe('playback-failed')
    expect(result.current.sourceFailed).toBe(false)

    act(() => last().dispatch('error'))
    expect(result.current.sourceFailed).toBe(true)
  })

  it('sourceFailed clears when the audio actually plays and when src changes', async () => {
    const { result, rerender } = setup('a.wav')
    act(() => last().dispatch('error'))
    expect(result.current.sourceFailed).toBe(true)

    await act(async () => result.current.play())
    expect(result.current.sourceFailed).toBe(false)

    act(() => last().dispatch('error'))
    expect(result.current.sourceFailed).toBe(true)
    rerender({ s: 'b.wav' })
    expect(result.current.sourceFailed).toBe(false)
  })

  it('an error fired by a disposed audio does not mark the next one as failed', () => {
    const { result, rerender } = setup('a.wav')
    const first = last()
    rerender({ s: 'b.wav' })
    act(() => first.dispatch('error'))
    expect(result.current.sourceFailed).toBe(false)
  })

  it('seek clamps to [0, duration], notifies once immediately even while paused, and matches after seeked', () => {
    const { result } = setup('a.wav')
    act(() => {
      last().duration = 10
      last().dispatch('loadedmetadata')
    })
    const seen: number[] = []
    act(() => void result.current.subscribe((t) => seen.push(t)))
    seen.length = 0

    act(() => result.current.seek(-5))
    expect(seen).toEqual([0])
    act(() => result.current.seek(99))
    expect(seen).toEqual([0, 10])
    expect(last().currentTime).toBe(10)
    act(() => result.current.seek(4))
    expect(seen).toEqual([0, 10, 4])
    act(() => last().dispatch('seeked'))
    expect(result.current.getTime()).toBe(4)
    // seeked re-publishes the audio's final position (the browser may snap it); same value here.
    expect(seen).toEqual([0, 10, 4, 4])
  })

  it('uses fallback duration for display and seek before metadata or when audio is shorter', () => {
    const { result } = renderHook(() => usePlaybackClock('a.wav', 12))
    expect(result.current.duration).toBe(12)

    act(() => result.current.seek(10))
    expect(last().currentTime).toBe(10)

    act(() => {
      last().duration = 8
      last().dispatch('loadedmetadata')
    })
    expect(result.current.duration).toBe(12)
    act(() => result.current.seek(11))
    expect(last().currentTime).toBe(8)
    expect(result.current.getTime()).toBe(8)

    act(() => {
      last().duration = 15
      last().dispatch('durationchange')
    })
    expect(result.current.duration).toBe(15)
  })

  it('ended sets playing false and stops the frame loop', async () => {
    const { result } = setup('a.wav')
    await act(async () => result.current.play())
    act(() => {
      last().paused = true
      last().dispatch('ended')
    })
    expect(result.current.playing).toBe(false)
    expect(raf.pending.size).toBe(0)
  })

  it('play after ended restarts the owned audio from 0', async () => {
    const { result } = setup('a.wav')
    const audio = last()
    audio.duration = 8
    audio.currentTime = 8
    audio.ended = true
    audio.paused = true
    audio.dispatch('ended')

    await act(async () => result.current.play())

    expect(audio.currentTime).toBe(0)
    expect(result.current.playing).toBe(true)
  })

  it('reports duration from loadedmetadata and durationchange; NaN and Infinity become 0', () => {
    const { result } = setup('a.wav')
    expect(result.current.duration).toBe(0)
    act(() => {
      last().duration = 12.5
      last().dispatch('loadedmetadata')
    })
    expect(result.current.duration).toBe(12.5)
    act(() => {
      last().duration = 20
      last().dispatch('durationchange')
    })
    expect(result.current.duration).toBe(20)
    act(() => {
      last().duration = Infinity
      last().dispatch('durationchange')
    })
    expect(result.current.duration).toBe(0)
    act(() => {
      last().duration = 5
      last().dispatch('durationchange')
      last().duration = NaN
      last().dispatch('durationchange')
    })
    expect(result.current.duration).toBe(0)
  })

  it('changing src releases the old audio, resets state and keeps exactly one live audio', async () => {
    FakeAudio.playError = null
    const { result, rerender } = setup('a.wav')
    const first = last()
    await act(async () => result.current.play())
    act(() => {
      first.currentTime = 7
      first.dispatch('durationchange')
    })
    expect(result.current.playing).toBe(true)

    rerender({ s: 'b.wav' })
    expect(first.released).toBe(true)
    expectBalanced(first)
    expect(live()).toHaveLength(1)
    expect(last()).not.toBe(first)
    expect(last().src).toContain('b.wav')
    expect(result.current.getTime()).toBe(0)
    expect(result.current.playing).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.duration).toBe(0)
    expect(raf.pending.size).toBe(0)
  })

  it('changing src clears a previous error', async () => {
    FakeAudio.playError = new Error('blocked')
    const { result, rerender } = setup('a.wav')
    await act(async () => result.current.play())
    expect(result.current.error).not.toBeNull()
    rerender({ s: 'b.wav' })
    expect(result.current.error).toBeNull()
  })

  it('hidden stops the frame loop; visible emits audio.currentTime and starts exactly one frame', async () => {
    const { result } = setup('a.wav')
    const seen: number[] = []
    act(() => void result.current.subscribe((t) => seen.push(t)))
    await act(async () => result.current.play())
    expect(raf.pending.size).toBe(1)
    seen.length = 0

    setVisibility('hidden')
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(raf.pending.size).toBe(0)
    expect(seen).toEqual([])
    expect(result.current.playing).toBe(true)

    last().currentTime = 33
    setVisibility('visible')
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(seen).toEqual([33])
    expect(raf.pending.size).toBe(1)
    act(() => raf.frame())
    expect(seen).toEqual([33, 33])
    expect(raf.pending.size).toBe(1)
  })

  it('visibilitychange while paused resyncs without starting the loop', () => {
    const { result } = setup('a.wav')
    const seen: number[] = []
    act(() => void result.current.subscribe((t) => seen.push(t)))
    seen.length = 0
    last().currentTime = 8
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(seen).toEqual([8])
    expect(raf.pending.size).toBe(0)
  })

  it('uses a single frame loop for many subscribers; all get the same value; unsubscribe mid-run is safe', async () => {
    const { result } = setup('a.wav')
    const a: number[] = []
    const b: number[] = []
    const c: number[] = []
    let unsubB = () => {}
    act(() => {
      result.current.subscribe((t) => {
        a.push(t)
        if (t === 2) unsubB()
      })
      unsubB = result.current.subscribe((t) => b.push(t))
      result.current.subscribe((t) => c.push(t))
    })
    a.length = b.length = c.length = 0
    await act(async () => result.current.play())
    expect(raf.pending.size).toBe(1)

    last().currentTime = 1
    act(() => raf.frame())
    expect(raf.pending.size).toBe(1)
    last().currentTime = 2
    act(() => raf.frame())
    last().currentTime = 3
    act(() => raf.frame())

    expect(a).toEqual([1, 2, 3])
    expect(c).toEqual([1, 2, 3])
    // B was unsubscribed by A during the frame for t=2, before B's turn: it never sees 2 or 3.
    expect(b).toEqual([1])
    expect(raf.pending.size).toBe(1)
  })

  it('a throwing subscriber is caught (logged) and does not block the others or the loop', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { result } = setup('a.wav')
    const ok: number[] = []
    act(() => {
      result.current.subscribe(() => {
        throw new Error('boom')
      })
      result.current.subscribe((t) => ok.push(t))
    })
    ok.length = 0
    await act(async () => result.current.play())
    last().currentTime = 1
    act(() => raf.frame())
    expect(ok).toEqual([1])
    expect(raf.pending.size).toBe(1)
    expect(spy).toHaveBeenCalled()
  })

  it('does not re-render on every frame', async () => {
    let renders = 0
    const { result } = renderHook(() => {
      renders++
      return usePlaybackClock('a.wav')
    })
    await act(async () => result.current.play())
    const before = renders
    for (let i = 1; i <= 20; i++) {
      last().currentTime = i
      act(() => raf.frame())
    }
    expect(renders).toBe(before)
  })

  it('unmount removes every listener, cancels the frame, pauses and releases src', async () => {
    const { result, unmount } = setup('a.wav')
    await act(async () => result.current.play())
    const audio = last()
    expect(raf.pending.size).toBe(1)

    unmount()
    expectBalanced(audio)
    expect(docAdds.visibilitychange).toBeGreaterThan(0)
    expect(docRemoves.visibilitychange).toBe(docAdds.visibilitychange)
    expect(raf.pending.size).toBe(0)
    expect(audio.released).toBe(true)
    expect(audio.paused).toBe(true)
    expect(live()).toHaveLength(0)
  })

  it('play, seek and pause after unmount do not throw or create audio', async () => {
    const { result, unmount } = setup('a.wav')
    const api = result.current
    unmount()
    const count = FakeAudio.instances.length
    await expect(api.play()).resolves.toBeUndefined()
    expect(() => api.seek(3)).not.toThrow()
    expect(() => api.pause()).not.toThrow()
    expect(api.getTime()).toBe(0)
    expect(FakeAudio.instances).toHaveLength(count)
    expect(raf.pending.size).toBe(0)
  })

  it('a play() rejection that lands after the src changed is ignored', async () => {
    let reject!: (e: Error) => void
    const { result, rerender } = setup('a.wav')
    last().play = () => new Promise<void>((_, rj) => (reject = rj))
    let p!: Promise<void>
    act(() => {
      p = result.current.play()
    })
    rerender({ s: 'b.wav' })
    reject(new Error('AbortError'))
    await act(async () => p)
    expect(result.current.error).toBeNull()
  })

  it('src undefined creates no audio', () => {
    const { result } = setup(undefined)
    expect(FakeAudio.instances).toHaveLength(0)
    expect(result.current.getTime()).toBe(0)
  })

  it('StrictMode double mount leaves one live audio, the first fully released, and play is not doubled', async () => {
    const { result, unmount } = setup('a.wav', true)
    expect(FakeAudio.instances).toHaveLength(2)
    const [first, second] = FakeAudio.instances
    expect(first.released).toBe(true)
    expectBalanced(first)
    expect(live()).toEqual([second])
    expect(docRemoves.visibilitychange).toBe(docAdds.visibilitychange - 1)

    await act(async () => result.current.play())
    expect(FakeAudio.instances.filter((a) => !a.paused)).toEqual([second])
    expect(first.paused).toBe(true)
    expect(raf.pending.size).toBe(1)

    unmount()
    expectBalanced(second)
    expect(live()).toHaveLength(0)
    expect(docRemoves.visibilitychange).toBe(docAdds.visibilitychange)
    expect(raf.pending.size).toBe(0)
  })
})
