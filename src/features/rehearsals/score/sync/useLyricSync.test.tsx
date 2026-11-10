import { StrictMode } from 'react'
import { act, render, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { usePlaybackClock } from '../clock/usePlaybackClock'
import { createActiveSyllableIndex, melismaSpans, type LyricSyllable } from '../lyrics'
import { parseTimemap } from '../timeline/parseTimemap'
import { ACTIVE_LYRIC_CLASS, useLyricSync, type LyricSyncClock } from './useLyricSync'

function fakeClock(start = 0) {
  const listeners = new Set<(time: number) => void>()
  let time = start
  // Duration unknown (0): no end of song, every tick is read as it comes.
  const clock: LyricSyncClock = {
    duration: 0,
    getTime: () => time,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => void listeners.delete(listener)
    },
  }
  return {
    clock,
    listeners,
    tick(next: number) {
      time = next
      for (const listener of [...listeners]) listener(next)
    },
  }
}

// Notes a 0–1 s, b 1–2 s, c 2–3 s, d 3 s to the end. Syllable "Ca" on a holds a melisma over b; "ngợi" on c; "A" (verse 2) on a.
const timeline = parseTimemap([
  { tstamp: 0, on: ['a'] },
  { tstamp: 1000, off: ['a'], on: ['b'] },
  { tstamp: 2000, off: ['b'], on: ['c'] },
  { tstamp: 3000, off: ['c'], on: ['d'] },
])
const syl = (syllableId: string, noteId: string, text: string, extra: Partial<LyricSyllable> = {}): LyricSyllable => ({
  syllableId,
  noteId,
  verse: '1',
  text,
  ...extra,
})
const verse1 = [syl('s-ca', 'a', 'Ca', { con: 'u' }), syl('s-ngoi', 'c', 'ngợi')]
const melismas = new Map([['a\u00001', ['b']]])
const indexOf = (syllables: LyricSyllable[]) => createActiveSyllableIndex(melismaSpans(syllables, timeline, melismas))

const sheet = (...ids: string[]) =>
  `<svg xmlns="http://www.w3.org/2000/svg">${ids.map((id) => `<g class="verse"><g id="${id}" class="syl"><text>x</text></g></g>`).join('')}</svg>`

function newRoot() {
  const root = document.createElement('div')
  root.innerHTML = sheet('s-ca', 's-ngoi', 's-a2')
  document.body.append(root)
  return root
}

const lit = (root: HTMLElement) => Array.from(root.querySelectorAll(`.${ACTIVE_LYRIC_CLASS}`), (element) => element.id)

function setup(start = 0, index = indexOf(verse1)) {
  const fake = fakeClock(start)
  const root = newRoot()
  const onRender = vi.fn()
  function Harness({ current }: Readonly<{ current: typeof index | null }>) {
    onRender()
    useLyricSync(fake.clock, root, current)
    return null
  }
  const view = render(<Harness current={index} />)
  return { ...fake, root, view, Harness, renders: () => onRender.mock.calls.length }
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('useLyricSync', () => {
  it('moves the class over 60 ticks without one React render per frame', () => {
    const { tick, root, renders } = setup()
    expect(lit(root)).toEqual(['s-ca'])
    const before = renders()
    for (let frame = 1; frame <= 60; frame += 1) tick(frame / 20)
    expect(renders()).toBe(before)
    expect(lit(root)).toEqual([])
  })

  it('keeps a melisma syllable lit over all of its notes', () => {
    const { tick, root } = setup()
    tick(0.5)
    expect(lit(root)).toEqual(['s-ca'])
    tick(1.9)
    expect(lit(root)).toEqual(['s-ca'])
    tick(2)
    expect(lit(root)).toEqual(['s-ngoi'])
  })

  it('touches the DOM only when the lit set changes', () => {
    const { tick, root } = setup()
    const element = root.querySelector('#s-ca')!
    const toggle = vi.spyOn(element.classList, 'toggle')
    for (let frame = 1; frame < 20; frame += 1) tick(frame / 10)
    expect(toggle).not.toHaveBeenCalled()
    tick(2.5)
    expect(toggle).toHaveBeenCalledTimes(1)
  })

  it('a backward seek switches off exactly what is no longer sung', () => {
    const { tick, root } = setup()
    tick(2.5)
    tick(0.5)
    expect(lit(root)).toEqual(['s-ca'])
  })

  describe('end of the song, with the real clock', () => {
    /**
     * Plays to the end the way Chromium does (checked on sample.wav): rAF frames while playing, the last one with currentTime
     * at the audio's duration, then pause and ended, which emit nothing; then "Phát lại" (play after ended). The note under
     * "ngợi" (verse 1) runs from 2 s to `noteEnd`; the audio lasts `audioEnd`.
     */
    async function playToEnd({ audioEnd, noteEnd, frames: times }: { audioEnd: number; noteEnd: number; frames: number[] }) {
      const frames = new Map<number, FrameRequestCallback>()
      let nextFrame = 1
      vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => (frames.set(nextFrame, cb), nextFrame++))
      vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id))
      const frame = () => {
        const batch = [...frames.values()]
        frames.clear()
        for (const cb of batch) cb(0)
      }
      const audio = { currentTime: 0, duration: audioEnd, ended: false, paused: true, src: '', preload: '' } as Record<string, unknown>
      const handlers = new Map<string, () => void>()
      Object.assign(audio, {
        addEventListener: (type: string, fn: () => void) => handlers.set(type, fn),
        removeEventListener: (type: string) => handlers.delete(type),
        play: () => {
          audio.paused = false
          audio.ended = false
          handlers.get('play')?.()
          return Promise.resolve()
        },
        pause: () => undefined,
        removeAttribute: () => undefined,
        load: () => undefined,
      })
      vi.stubGlobal('Audio', function FakeAudio() {
        return audio
      })
      const timeline = parseTimemap([
        { tstamp: 0, on: ['a'] },
        { tstamp: 1000, off: ['a'], on: ['b'] },
        { tstamp: 2000, off: ['b'], on: ['c'] },
        { tstamp: Math.round(noteEnd * 1000), off: ['c'] },
      ])
      const root = newRoot()
      const index = createActiveSyllableIndex(melismaSpans(verse1, timeline, melismas))
      const { result } = renderHook(() => {
        const clock = usePlaybackClock('blob:song')
        useLyricSync(clock, root, index)
        return clock
      })
      act(() => handlers.get('loadedmetadata')?.())
      await act(() => result.current.play())
      const seen: string[][] = []
      for (const time of times) {
        audio.currentTime = time
        act(frame)
        seen.push(lit(root))
      }
      audio.paused = true
      audio.ended = true
      act(() => {
        handlers.get('pause')?.()
        handlers.get('ended')?.()
      })
      expect(frames.size).toBe(0)
      const afterEnd = lit(root)
      await act(() => result.current.play())
      expect(audio.currentTime).toBe(0)
      const afterReplay = lit(root)
      vi.unstubAllGlobals()
      return { seen, afterEnd, afterReplay }
    }

    it('audio ending exactly with the last syllable (3.000 s both): it stays lit, and Phát lại lights the first again', async () => {
      const run = await playToEnd({ audioEnd: 3, noteEnd: 3, frames: [0.5, 2.5, 3] })
      expect(run.seen).toEqual([['s-ca'], ['s-ngoi'], ['s-ngoi']])
      expect(run.afterEnd).toEqual(['s-ngoi'])
      expect(run.afterReplay).toEqual(['s-ca'])
    })

    it('audio 5 ms shorter than the timeline (as sample.wav, 10.662 s against 10.667 s): the last syllable stays lit', async () => {
      const run = await playToEnd({ audioEnd: 2.995, noteEnd: 3, frames: [0.5, 2.5, 2.995] })
      expect(run.afterEnd).toEqual(['s-ngoi'])
      expect(run.afterReplay).toEqual(['s-ca'])
    })

    it('span a few ms longer than the audio (3.005 s against 3.000 s): the last syllable stays lit', async () => {
      const run = await playToEnd({ audioEnd: 3, noteEnd: 3.005, frames: [0.5, 2.5, 3] })
      expect(run.afterEnd).toEqual(['s-ngoi'])
    })

    it('audio longer than the score (a reverb tail): the syllable still goes dark at its end, not held to the end of the sound', async () => {
      const run = await playToEnd({ audioEnd: 3.5, noteEnd: 3, frames: [0.5, 2.5, 3, 3.2, 3.5] })
      expect(run.seen).toEqual([['s-ca'], ['s-ngoi'], [], [], []])
      expect(run.afterEnd).toEqual([])
      expect(run.afterReplay).toEqual(['s-ca'])
    })
  })

  it('re-applies after the viewer replaces its content (relayout, new scoreKey)', async () => {
    const { tick, root } = setup()
    tick(2.5)
    await act(async () => {
      root.innerHTML = sheet('s-ca', 's-ngoi')
      await Promise.resolve()
    })
    expect(lit(root)).toEqual(['s-ngoi'])
    tick(0.5)
    expect(lit(root)).toEqual(['s-ca'])
  })

  it('a new index switches off the old syllables and lights the new ones at the current time', () => {
    const { tick, root, view, Harness } = setup()
    tick(0.5)
    view.rerender(<Harness current={indexOf([syl('s-a2', 'a', 'A', { verse: '2' })])} />)
    expect(lit(root)).toEqual(['s-a2'])
    view.rerender(<Harness current={null} />)
    expect(lit(root)).toEqual([])
  })

  it('unmount unsubscribes, clears the class and stops watching the sheet', async () => {
    const { root, view, listeners } = setup()
    view.unmount()
    expect(listeners.size).toBe(0)
    expect(lit(root)).toEqual([])
    root.innerHTML = sheet('s-ca')
    await Promise.resolve()
    expect(lit(root)).toEqual([])
  })

  it('StrictMode double mount leaves one listener and the right syllable', () => {
    const fake = fakeClock()
    const root = newRoot()
    const index = indexOf(verse1)
    function Harness() {
      useLyricSync(fake.clock, root, index)
      return null
    }
    render(
      <StrictMode>
        <Harness />
      </StrictMode>,
    )
    expect(fake.listeners.size).toBe(1)
    expect(lit(root)).toEqual(['s-ca'])
    fake.tick(2.5)
    expect(lit(root)).toEqual(['s-ngoi'])
  })

  it('only touches syllables inside its own root and skips ids the sheet does not have', () => {
    const fake = fakeClock()
    const root = document.createElement('div')
    root.innerHTML = sheet('s-ngoi')
    const outside = document.createElement('div')
    outside.innerHTML = sheet('s-ca')
    document.body.append(root, outside)
    const index = indexOf(verse1)
    function Harness() {
      useLyricSync(fake.clock, root, index)
      return null
    }
    render(<Harness />)
    expect(lit(outside)).toEqual([])
    expect(() => fake.tick(2.5)).not.toThrow()
    expect(lit(root)).toEqual(['s-ngoi'])
  })
})
