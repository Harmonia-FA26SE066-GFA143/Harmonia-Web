import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '@/app/providers'
import * as songsApi from '@/features/music-library/api/songsApi'
import { timedLinePhase, type SongMaterial } from '@/features/music-library'
import { TimedLyricsView } from './TimedLyricsView'

const lines = [
  { order: 1, text: 'Lạy Chúa', startSeconds: 1, endSeconds: 3 },
  { order: 2, text: 'Xin thương con', startSeconds: 5, endSeconds: 8 },
]
const material = { id: 'a1', kind: 'sampleAudio', title: 'Audio', fileRevision: 3, url: 'https://f/a' } as SongMaterial

function fakeClock() {
  let time = 0
  const listeners = new Set<(seconds: number) => void>()
  return {
    getTime: () => time,
    subscribe: (listener: (seconds: number) => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    to: (seconds: number) => {
      time = seconds
      act(() => listeners.forEach((listener) => listener(seconds)))
    },
  }
}

const show = (clock: ReturnType<typeof fakeClock>, props = {}) =>
  render(<AppProviders><TimedLyricsView material={material} clock={clock} untimed={<p>Lời thường</p>} {...props} /></AppProviders>)

afterEach(() => vi.restoreAllMocks())

describe('timedLinePhase', () => {
  it('tells before, during and past each line', () => {
    expect(timedLinePhase(lines, 0)).toBe(0)
    expect(timedLinePhase(lines, 1)).toBe(1)
    expect(timedLinePhase(lines, 3)).toBe(2)
    expect(timedLinePhase(lines, 5)).toBe(3)
    expect(timedLinePhase(lines, 8)).toBe(-1)
  })
})

describe('TimedLyricsView', () => {
  it('shows the line sounding at the audio time and the one after it', async () => {
    vi.spyOn(songsApi, 'getTimedLyrics').mockResolvedValue({ lyricsMaterialId: 'l', audioMaterialId: 'a1', audioRevision: 3, lines })
    const clock = fakeClock()
    show(clock)
    await screen.findByLabelText('Lời theo mốc thời gian của âm thanh')

    clock.to(2)
    const [current, next] = screen.getByLabelText('Lời theo mốc thời gian của âm thanh').querySelectorAll('p')
    expect(current).toHaveTextContent('Lạy Chúa')
    expect(next).toHaveTextContent('Xin thương con')

    clock.to(4) // between lines: nothing sounding, the next one announced
    expect(current).toBeEmptyDOMElement()
    expect(next).toHaveTextContent('Xin thương con')
  })

  it('falls back to plain lyrics when the audio has no timing', async () => {
    vi.spyOn(songsApi, 'getTimedLyrics').mockResolvedValue(null)
    show(fakeClock())
    expect(await screen.findByText('Lời thường')).toBeInTheDocument()
  })

  it('hides a timing of another revision and asks for the list again', async () => {
    vi.spyOn(songsApi, 'getTimedLyrics').mockResolvedValue({ lyricsMaterialId: 'l', audioMaterialId: 'a1', audioRevision: 4, lines })
    const onStale = vi.fn()
    show(fakeClock(), { onStale })

    expect(await screen.findByText(/Đang cập nhật lời/)).toBeInTheDocument()
    expect(screen.queryByText('Lạy Chúa')).toBeNull()
    expect(onStale).toHaveBeenCalledTimes(1)
  })
})
