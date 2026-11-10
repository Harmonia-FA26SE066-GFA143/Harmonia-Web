import { StrictMode, useState } from 'react'
import { act, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTimelineCursor } from '../timeline/cursor'
import { parseTimemap } from '../timeline/parseTimemap'
import { ACTIVE_NOTE_CLASS, useScoreSync, type ScoreSyncClock } from './useScoreSync'

function fakeClock(start = 0) {
  const listeners = new Set<(time: number) => void>()
  let time = start
  const clock: ScoreSyncClock = {
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

const notesMarkup = (...ids: string[]) =>
  `<svg xmlns="http://www.w3.org/2000/svg">${ids.map((id) => `<g id="${id}" class="note"><path d="M0 0"/></g>`).join('')}</svg>`

// a 0–1 s; b and c (a chord) 1–2 s; d 2 s to the end, never switched off.
const newCursor = () =>
  createTimelineCursor(
    parseTimemap([
      { tstamp: 0, on: ['a'] },
      { tstamp: 1000, off: ['a'], on: ['b', 'c'] },
      { tstamp: 2000, off: ['b', 'c'], on: ['d'] },
    ]),
  )

function newRoot() {
  const root = document.createElement('div')
  root.innerHTML = notesMarkup('a', 'b', 'c', 'd')
  document.body.append(root)
  return root
}

const activeIds = (root: HTMLElement) => Array.from(root.querySelectorAll(`.${ACTIVE_NOTE_CLASS}`), (element) => element.id)

function setup(start = 0) {
  const fake = fakeClock(start)
  const root = newRoot()
  const cursor = newCursor()
  const onRender = vi.fn()
  function Harness() {
    onRender()
    useScoreSync(fake.clock, root, cursor)
    return null
  }
  const view = render(<Harness />)
  return { ...fake, root, view, cursor, renders: () => onRender.mock.calls.length }
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('useScoreSync', () => {
  it('moves the class by id without one React render per frame', () => {
    const { tick, root, renders } = setup()
    expect(activeIds(root)).toEqual(['a'])
    const before = renders()
    for (let frame = 1; frame <= 60; frame += 1) tick(frame / 20)
    expect(renders()).toBe(before)
    expect(activeIds(root)).toEqual(['d'])
  })

  it('lights both notes of a chord and swaps at the boundary', () => {
    const { tick, root } = setup()
    tick(1.5)
    expect(activeIds(root)).toEqual(['b', 'c'])
    tick(2)
    expect(activeIds(root)).toEqual(['d'])
  })

  it('a backward seek switches off exactly what is no longer sounding', () => {
    const { tick, root } = setup()
    tick(2.5)
    tick(0.5)
    expect(activeIds(root)).toEqual(['a'])
    tick(1.5)
    expect(activeIds(root)).toEqual(['b', 'c'])
  })

  it('starts from the time the clock already has', () => {
    const { root } = setup(1.5)
    expect(activeIds(root)).toEqual(['b', 'c'])
  })

  it('keeps the last state when the audio ends, then restarts from 0', () => {
    const { tick, root, listeners } = setup()
    tick(5)
    expect(activeIds(root)).toEqual(['d'])
    // Ended: the clock stops ticking and nothing clears the sheet.
    expect(listeners.size).toBe(1)
    expect(activeIds(root)).toEqual(['d'])
    tick(0)
    expect(activeIds(root)).toEqual(['a'])
  })

  it('unmount unsubscribes, clears the class and stops watching the sheet', async () => {
    const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect')
    const { root, view, listeners, tick } = setup()
    tick(1.5)
    view.unmount()
    expect(listeners.size).toBe(0)
    expect(disconnect).toHaveBeenCalledTimes(1)
    expect(activeIds(root)).toEqual([])
    root.innerHTML = notesMarkup('a', 'b', 'c', 'd')
    await Promise.resolve()
    expect(activeIds(root)).toEqual([])
  })

  it('StrictMode double mount leaves one listener and the right notes', () => {
    const fake = fakeClock()
    const root = newRoot()
    const cursor = newCursor()
    function Harness() {
      useScoreSync(fake.clock, root, cursor)
      return null
    }
    render(
      <StrictMode>
        <Harness />
      </StrictMode>,
    )
    expect(fake.listeners.size).toBe(1)
    expect(activeIds(root)).toEqual(['a'])
    fake.tick(1.5)
    expect(activeIds(root)).toEqual(['b', 'c'])
  })

  it('re-applies the current notes after the viewer replaces its content (relayout)', async () => {
    const { tick, root } = setup()
    tick(1.5)
    await act(async () => {
      root.innerHTML = notesMarkup('a', 'b', 'c', 'd')
      await Promise.resolve()
    })
    expect(activeIds(root)).toEqual(['b', 'c'])
    tick(2.5)
    expect(activeIds(root)).toEqual(['d'])
  })

  it('lights the first notes once the sanitized pages arrive after the subscription', async () => {
    const fake = fakeClock()
    const root = document.createElement('div')
    document.body.append(root)
    const cursor = newCursor()
    function Harness() {
      useScoreSync(fake.clock, root, cursor)
      return null
    }
    render(<Harness />)
    expect(activeIds(root)).toEqual([])
    await act(async () => {
      root.innerHTML = notesMarkup('a', 'b')
      await Promise.resolve()
    })
    expect(activeIds(root)).toEqual(['a'])
  })

  it('only touches notes inside its own root', () => {
    const fake = fakeClock()
    const root = document.createElement('div')
    root.innerHTML = notesMarkup('b')
    const outside = document.createElement('div')
    outside.innerHTML = notesMarkup('a')
    document.body.append(root, outside)
    const cursor = newCursor()
    function Harness() {
      useScoreSync(fake.clock, root, cursor)
      return null
    }
    render(<Harness />)
    expect(activeIds(outside)).toEqual([])
  })

  it('skips an id the sheet does not have', () => {
    const fake = fakeClock()
    const root = newRoot()
    const cursor = createTimelineCursor(parseTimemap([{ tstamp: 0, on: ['missing-rend2', 'a'] }, { tstamp: 1000, off: ['missing-rend2', 'a'] }]))
    function Harness() {
      useScoreSync(fake.clock, root, cursor)
      return null
    }
    render(<Harness />)
    expect(activeIds(root)).toEqual(['a'])
    expect(() => fake.tick(2)).not.toThrow()
  })

  it('does nothing until it has a root and a cursor, then starts', () => {
    const fake = fakeClock()
    const root = newRoot()
    const subscribe = vi.spyOn(fake.clock, 'subscribe')
    function Harness() {
      const [target, setTarget] = useState<HTMLElement | null>(null)
      const [cursor, setCursor] = useState<ReturnType<typeof newCursor> | null>(null)
      useScoreSync(fake.clock, target, cursor)
      return (
        <button
          type="button"
          onClick={() => {
            setTarget(root)
            setCursor(newCursor())
          }}
        />
      )
    }
    const view = render(<Harness />)
    expect(subscribe).not.toHaveBeenCalled()
    fireEvent.click(view.getByRole('button'))
    expect(subscribe).toHaveBeenCalledTimes(1)
    expect(activeIds(root)).toEqual(['a'])
  })
})
