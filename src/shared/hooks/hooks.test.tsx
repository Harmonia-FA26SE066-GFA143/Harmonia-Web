import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react'
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

  function Probe() {
    const [tab, setTab] = useUrlTab(keys, 'songs')
    const { search, state } = useLocation()
    return (
      <>
        <p data-testid="tab">{tab}</p>
        <p data-testid="search">{search}</p>
        <p data-testid="state">{JSON.stringify(state)}</p>
        <button onClick={() => setTab('roster')}>roster</button>
        <button onClick={() => setTab('songs')}>songs</button>
      </>
    )
  }

  const renderTab = (search: string, state?: unknown) =>
    render(<RouterProvider router={createMemoryRouter([{ path: '/p', element: <Probe /> }], { initialEntries: [{ pathname: '/p', search, state }] })} />)

  it('reads a known tab and falls back on an unknown one', () => {
    renderTab('?tab=roster')
    expect(screen.getByTestId('tab')).toHaveTextContent('roster')
    cleanup()
    renderTab('?tab=hack')
    expect(screen.getByTestId('tab')).toHaveTextContent('songs')
  })

  it('writes the tab, drops it for the fallback, and keeps other params and router state', () => {
    renderTab('?page=2', { listSearch: '?q=1' })
    fireEvent.click(screen.getByRole('button', { name: 'roster' }))
    expect(screen.getByTestId('search')).toHaveTextContent('?page=2&tab=roster')
    expect(screen.getByTestId('state')).toHaveTextContent('{"listSearch":"?q=1"}')
    fireEvent.click(screen.getByRole('button', { name: 'songs' }))
    expect(screen.getByTestId('search')).toHaveTextContent(/^\?page=2$/)
  })
})
