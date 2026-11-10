import { Profiler } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { PlaybackClock } from '../clock/usePlaybackClock'
import { PlaybackControls } from './PlaybackControls'

function fakeClock(over: Partial<PlaybackClock> = {}) {
  const listeners = new Set<(time: number) => void>()
  let time = 0
  const clock: PlaybackClock = {
    playing: false,
    duration: 125,
    error: null,
    play: vi.fn(async () => {}),
    pause: vi.fn(),
    seek: vi.fn((seconds: number) => {
      time = seconds
      for (const listener of [...listeners]) listener(seconds)
    }),
    getTime: () => time,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => void listeners.delete(listener)
    },
    ...over,
  }
  return {
    clock,
    listeners,
    setTime: (next: number) => {
      time = next
    },
    tick: (next: number) =>
      act(() => {
        time = next
        for (const listener of [...listeners]) listener(next)
      }),
  }
}

const TITLE = 'Kinh Hoà Bình'
const playButton = () => screen.getByRole('button', { name: `Phát ${TITLE}` })
const positionSlider = () => screen.getByRole('slider', { name: `Vị trí phát ${TITLE}` })

describe('PlaybackControls', () => {
  it('play starts the clock; while playing the button pauses it', () => {
    const paused = fakeClock()
    const { rerender } = render(<PlaybackControls clock={paused.clock} title={TITLE} />)
    fireEvent.click(playButton())
    expect(paused.clock.play).toHaveBeenCalledTimes(1)

    const playing = fakeClock({ playing: true })
    rerender(<PlaybackControls clock={playing.clock} title={TITLE} />)
    fireEvent.click(screen.getByRole('button', { name: `Tạm dừng ${TITLE}` }))
    expect(playing.clock.pause).toHaveBeenCalledTimes(1)
    expect(playing.clock.play).not.toHaveBeenCalled()
  })

  it('moving the slider seeks', () => {
    const { clock } = fakeClock()
    render(<PlaybackControls clock={clock} title={TITLE} />)
    fireEvent.keyDown(positionSlider(), { key: 'End', code: 'End', keyCode: 35 })
    expect(clock.seek).toHaveBeenCalledWith(125)
  })

  it('shows mm:ss / mm:ss and follows the clock', () => {
    const { clock, tick } = fakeClock({ playing: true })
    render(<PlaybackControls clock={clock} title={TITLE} />)
    expect(screen.getByText('00:00 / 02:05')).toBeInTheDocument()
    tick(61.4)
    expect(screen.getByText('01:01 / 02:05')).toBeInTheDocument()
  })

  it('re-renders once per second of playback, not per frame', () => {
    const { clock, tick } = fakeClock({ playing: true })
    const onCommit = vi.fn()
    render(
      <Profiler id="controls" onRender={onCommit}>
        <PlaybackControls clock={clock} title={TITLE} />
      </Profiler>,
    )
    const commits = onCommit.mock.calls.length
    for (let frame = 1; frame <= 50; frame += 1) tick(frame / 100)
    expect(onCommit).toHaveBeenCalledTimes(commits)
    tick(1.01)
    expect(screen.getByText('00:01 / 02:05')).toBeInTheDocument()
  })

  it('after the end the button replays through the clock, which restarts from 0', () => {
    const fake = fakeClock({ playing: true })
    const { rerender } = render(<PlaybackControls clock={fake.clock} title={TITLE} />)
    fake.setTime(125)
    // Ended: the clock emits nothing more and only `playing` changes.
    rerender(<PlaybackControls clock={{ ...fake.clock, playing: false }} title={TITLE} />)
    expect(screen.getByText('02:05 / 02:05')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: `Phát lại ${TITLE}` }))
    expect(fake.clock.play).toHaveBeenCalledTimes(1)
    // What the real clock does on play() after the end: position 0, then the audio's play event.
    fake.setTime(0)
    rerender(<PlaybackControls clock={fake.clock} title={TITLE} />)
    expect(screen.getByText('00:00 / 02:05')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: `Phát lại ${TITLE}` })).not.toBeInTheDocument()
  })

  it('pause then resume keeps the slider where the audio is, not at the last whole-second tick', () => {
    const fake = fakeClock({ playing: true })
    const { rerender } = render(<PlaybackControls clock={fake.clock} title={TITLE} />)
    fake.tick(1.1)
    fake.tick(1.9) // same second: no render
    rerender(<PlaybackControls clock={{ ...fake.clock, playing: false }} title={TITLE} />)
    expect(Number(positionSlider().getAttribute('aria-valuenow'))).toBeCloseTo(1.9)
    rerender(<PlaybackControls clock={{ ...fake.clock, playing: true }} title={TITLE} />)
    expect(Number(positionSlider().getAttribute('aria-valuenow'))).toBeCloseTo(1.9)
  })

  it('a sub-second seek moves the slider at once', () => {
    const { clock } = fakeClock({ duration: 10 })
    render(<PlaybackControls clock={clock} title={TITLE} />)
    fireEvent.keyDown(positionSlider(), { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 })
    expect(clock.seek).toHaveBeenCalledTimes(1)
    const seconds = vi.mocked(clock.seek).mock.calls[0][0]
    expect(Number(positionSlider().getAttribute('aria-valuenow'))).toBeCloseTo(seconds)
  })

  it('speaks the position as time', () => {
    const { clock, tick } = fakeClock({ playing: true })
    render(<PlaybackControls clock={clock} title={TITLE} />)
    tick(61.4)
    expect(positionSlider()).toHaveAttribute('aria-valuetext', '01:01 trên 02:05')
  })

  it('has no usable slider before the audio has a duration', () => {
    const { clock } = fakeClock({ duration: 0 })
    render(<PlaybackControls clock={clock} title={TITLE} />)
    expect(positionSlider()).toHaveAttribute('aria-disabled', 'true')
  })

  it('reports a playback failure and still lets the user try again', () => {
    const { clock } = fakeClock({ error: 'playback-failed' })
    render(<PlaybackControls clock={clock} title={TITLE} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Không thể phát âm thanh')
    expect(playButton()).toBeEnabled()
  })

  it('unsubscribes on unmount', () => {
    const { clock, listeners } = fakeClock()
    const view = render(<PlaybackControls clock={clock} title={TITLE} />)
    expect(listeners.size).toBe(1)
    view.unmount()
    expect(listeners.size).toBe(0)
  })
})
