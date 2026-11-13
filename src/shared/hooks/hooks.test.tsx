import { act, render, renderHook } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useJustSaved } from '@/shared/ui/useJustSaved'
import { useReducedMotion } from '@/shared/ui/useReducedMotion'
import { useDebouncedValue } from './useDebouncedValue'
import { useUrlTab } from './useUrlTab'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('useDebouncedValue', () => {
  it('updates only once the value stops changing', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), { initialProps: { value: 'a' } })
    rerender({ value: 'ab' })
    act(() => vi.advanceTimersByTime(200))
    rerender({ value: 'abc' })
    act(() => vi.advanceTimersByTime(200))
    expect(result.current).toBe('a')
    act(() => vi.advanceTimersByTime(100))
    expect(result.current).toBe('abc')
  })
})

describe('useJustSaved', () => {
  it('holds for the given time, restarting on a new save', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useJustSaved(1000))
    expect(result.current[0]).toBe(false)
    act(() => result.current[1]())
    act(() => vi.advanceTimersByTime(800))
    act(() => result.current[1]())
    act(() => vi.advanceTimersByTime(800))
    expect(result.current[0]).toBe(true)
    act(() => vi.advanceTimersByTime(200))
    expect(result.current[0]).toBe(false)
  })
})

describe('useReducedMotion', () => {
  it('follows the system setting while mounted', () => {
    let matches = false
    const listeners = new Set<() => void>()
    vi.spyOn(window, 'matchMedia').mockImplementation(
      () =>
        ({
          get matches() {
            return matches
          },
          addEventListener: (_: string, listener: () => void) => listeners.add(listener),
          removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
        }) as unknown as MediaQueryList,
    )
    const { result, unmount } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
    matches = true
    act(() => listeners.forEach((listener) => listener()))
    expect(result.current).toBe(true)
    unmount()
    expect(listeners.size).toBe(0)
  })
})

describe('useUrlTab', () => {
  const keys = ['songs', 'roster'] as const

  function renderTab(entry: string, state?: unknown) {
    let location: ReturnType<typeof useLocation> | undefined
    const probe = { current: undefined as ReturnType<typeof useUrlTab<'songs' | 'roster'>> | undefined }
    function Probe() {
      probe.current = useUrlTab(keys, 'songs')
      location = useLocation()
      return null
    }
    const router = createMemoryRouter([{ path: '/p', element: <Probe /> }], { initialEntries: [{ pathname: '/p', search: entry, state }] })
    render(<RouterProvider router={router} />)
    return { probe, location: () => location }
  }

  it('reads a known tab and falls back on an unknown one', () => {
    expect(renderTab('?tab=roster').probe.current?.[0]).toBe('roster')
    expect(renderTab('?tab=hack').probe.current?.[0]).toBe('songs')
  })

  it('writes the tab, drops it for the fallback, and keeps other params and router state', () => {
    const { probe, location } = renderTab('?page=2', { listSearch: '?q=1' })
    act(() => probe.current?.[1]('roster'))
    expect(location()?.search).toBe('?page=2&tab=roster')
    expect(location()?.state).toEqual({ listSearch: '?q=1' })
    act(() => probe.current?.[1]('songs'))
    expect(location()?.search).toBe('?page=2')
  })
})
