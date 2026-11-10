import { StrictMode } from 'react'
import { fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useScoreShortcuts, type ShortcutClock } from './useScoreShortcuts'

function setup({ playing = false, duration = 60, time = 20 }: { playing?: boolean; duration?: number; time?: number } = {}) {
  let now = time
  const clock: ShortcutClock = {
    playing,
    duration,
    play: vi.fn(() => Promise.resolve()),
    pause: vi.fn(),
    seek: vi.fn((seconds: number) => void (now = seconds)),
    getTime: () => now,
  }
  const outside = document.createElement('button')
  const root = document.createElement('div')
  root.innerHTML = `
    <div id="sheet" tabindex="0" role="group"></div>
    <input id="field" />
    <textarea id="area"></textarea>
    <select id="choice"><option>a</option></select>
    <div id="rich" contenteditable="true"><span id="rich-child"></span></div>
    <button id="play">Phát</button>
    <div id="slider" role="slider" tabindex="0"></div>`
  document.body.append(outside, root)
  function Harness() {
    useScoreShortcuts(root, clock)
    return null
  }
  const view = render(
    <StrictMode>
      <Harness />
    </StrictMode>,
  )
  const on = (selector: string) => root.querySelector<HTMLElement>(selector)!
  return { clock, root, outside, on, view, setTime: (next: number) => void (now = next) }
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('useScoreShortcuts', () => {
  it('Space plays when paused and pauses when playing, without scrolling the page', () => {
    const paused = setup()
    expect(fireEvent.keyDown(paused.on('#sheet'), { key: ' ', code: 'Space' })).toBe(false) // preventDefault was called
    expect(paused.clock.play).toHaveBeenCalledTimes(1)
    expect(paused.clock.pause).not.toHaveBeenCalled()
    paused.view.unmount()

    const playing = setup({ playing: true })
    fireEvent.keyDown(playing.on('#sheet'), { key: ' ', code: 'Space' })
    expect(playing.clock.pause).toHaveBeenCalledTimes(1)
    expect(playing.clock.play).not.toHaveBeenCalled()
  })

  it('arrow keys step 5 seconds and Home goes to the start', () => {
    const { clock, on } = setup()
    fireEvent.keyDown(on('#sheet'), { key: 'ArrowRight' })
    expect(clock.seek).toHaveBeenLastCalledWith(25)
    fireEvent.keyDown(on('#sheet'), { key: 'ArrowLeft' })
    fireEvent.keyDown(on('#sheet'), { key: 'ArrowLeft' })
    expect(clock.seek).toHaveBeenLastCalledWith(15)
    fireEvent.keyDown(on('#sheet'), { key: 'Home' })
    expect(clock.seek).toHaveBeenLastCalledWith(0)
  })

  it('keeps the position inside [0, duration]', () => {
    const { clock, on, setTime } = setup({ time: 2 })
    fireEvent.keyDown(on('#sheet'), { key: 'ArrowLeft' })
    expect(clock.seek).toHaveBeenLastCalledWith(0)
    setTime(58)
    fireEvent.keyDown(on('#sheet'), { key: 'ArrowRight' })
    expect(clock.seek).toHaveBeenLastCalledWith(60)
  })

  it.each([0, Number.NaN, -1])('seeks to the start only while the duration is %s', (duration) => {
    const { clock, on } = setup({ duration, time: 3 })
    for (const key of ['ArrowRight', 'ArrowLeft', 'Home']) {
      fireEvent.keyDown(on('#sheet'), { key })
      expect(clock.seek).toHaveBeenLastCalledWith(0)
    }
    expect(clock.seek).toHaveBeenCalledTimes(3)
  })

  it.each(['#field', '#area', '#choice', '#rich', '#rich-child'])('leaves every key alone while typing in %s', (selector) => {
    const { clock, on } = setup()
    for (const key of [' ', 'ArrowLeft', 'ArrowRight', 'Home']) expect(fireEvent.keyDown(on(selector), { key })).toBe(true)
    expect(clock.play).not.toHaveBeenCalled()
    expect(clock.seek).not.toHaveBeenCalled()
  })

  it('leaves Space to a focused button, and the arrows and Home to a focused slider', () => {
    const { clock, on } = setup()
    expect(fireEvent.keyDown(on('#play'), { key: ' ' })).toBe(true)
    expect(clock.play).not.toHaveBeenCalled()
    for (const key of ['ArrowLeft', 'ArrowRight', 'Home']) expect(fireEvent.keyDown(on('#slider'), { key })).toBe(true)
    expect(clock.seek).not.toHaveBeenCalled()
    fireEvent.keyDown(on('#play'), { key: 'ArrowRight' }) // a button has no arrow behaviour of its own
    expect(clock.seek).toHaveBeenCalledWith(25)
  })

  it('ignores a key with a modifier, other keys, and a key already handled', () => {
    const { clock, on } = setup()
    for (const modifier of ['ctrlKey', 'altKey', 'metaKey', 'shiftKey']) {
      fireEvent.keyDown(on('#sheet'), { key: 'ArrowRight', [modifier]: true })
      fireEvent.keyDown(on('#sheet'), { key: ' ', [modifier]: true })
    }
    fireEvent.keyDown(on('#sheet'), { key: 'a' })
    fireEvent.keyDown(on('#sheet'), { key: 'ArrowDown' })
    const handled = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })
    handled.preventDefault()
    on('#sheet').dispatchEvent(handled)
    expect(clock.seek).not.toHaveBeenCalled()
    expect(clock.play).not.toHaveBeenCalled()
  })

  it('does not toggle again for a held-down Space', () => {
    const { clock, on } = setup()
    fireEvent.keyDown(on('#sheet'), { key: ' ', repeat: true })
    expect(clock.play).not.toHaveBeenCalled()
  })

  it('works only inside the section, and stops on unmount', () => {
    const { clock, outside, on, view } = setup()
    fireEvent.keyDown(outside, { key: 'ArrowRight' })
    fireEvent.keyDown(document.body, { key: ' ' })
    expect(clock.seek).not.toHaveBeenCalled()
    expect(clock.play).not.toHaveBeenCalled()
    view.unmount()
    fireEvent.keyDown(on('#sheet'), { key: 'ArrowRight' })
    expect(clock.seek).not.toHaveBeenCalled()
  })

  it('uses the latest clock after a re-render', () => {
    const root = document.createElement('div')
    root.innerHTML = '<div id="sheet" tabindex="0"></div>'
    document.body.append(root)
    const first: ShortcutClock = { playing: false, duration: 60, play: vi.fn(() => Promise.resolve()), pause: vi.fn(), seek: vi.fn(), getTime: () => 0 }
    const second: ShortcutClock = { ...first, playing: true, pause: vi.fn() }
    function Harness({ current }: Readonly<{ current: ShortcutClock }>) {
      useScoreShortcuts(root, current)
      return null
    }
    const view = render(<Harness current={first} />)
    view.rerender(<Harness current={second} />)
    fireEvent.keyDown(root.querySelector('#sheet')!, { key: ' ' })
    expect(second.pause).toHaveBeenCalledTimes(1)
    expect(first.play).not.toHaveBeenCalled()
  })
})
