import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAdjacentDirectorPrograms } from './useAdjacentPrograms'
import { usePrograms } from './usePrograms'

vi.mock('./usePrograms', () => ({ usePrograms: vi.fn() }))
vi.mock('./useEvents', () => ({ useEvents: vi.fn() }))
vi.mock('./useEventNames', () => ({ useEventNames: () => ({ eventName: () => '' }) }))

const program = (id: string, date: string) => ({ id, eventName: `Lễ ${id}`, date })

/** usePrograms answers the window before the date first, then the window after it. */
function answer(earlier?: ReturnType<typeof program>[], later?: ReturnType<typeof program>[]) {
  vi.mocked(usePrograms).mockImplementation(((range: { toDate?: string }) => ({
    data: { items: range.toDate === '2026-11-15' ? earlier : later },
  })) as unknown as typeof usePrograms)
}

beforeEach(() => {
  vi.mocked(usePrograms).mockReset()
})

describe('useAdjacentDirectorPrograms', () => {
  it('asks for 14 days either side of the date', () => {
    answer([], [])
    renderHook(() => useAdjacentDirectorPrograms('p', '2026-11-15'))
    expect(vi.mocked(usePrograms).mock.calls.slice(0, 2).map(([range]) => range)).toEqual([
      { fromDate: '2026-11-01', toDate: '2026-11-15' },
      { fromDate: '2026-11-15', toDate: '2026-11-29' },
    ])
  })

  it('takes the entry just before from the earlier window and just after from the later one', () => {
    answer([program('a', '2026-11-08'), program('b', '2026-11-15'), program('p', '2026-11-15')], [program('p', '2026-11-15'), program('c', '2026-11-22')])
    const { result } = renderHook(() => useAdjacentDirectorPrograms('p', '2026-11-15'))
    expect(result.current).toEqual({
      previous: { id: 'b', name: 'Lễ b', date: '2026-11-15' },
      next: { id: 'c', name: 'Lễ c', date: '2026-11-22' },
    })
  })

  it('offers nothing at the edges, while loading, or when the program is missing', () => {
    answer([program('p', '2026-11-15')], undefined)
    expect(renderHook(() => useAdjacentDirectorPrograms('p', '2026-11-15')).result.current).toEqual({ previous: undefined, next: undefined })
    answer([program('a', '2026-11-08')], [program('c', '2026-11-22')])
    expect(renderHook(() => useAdjacentDirectorPrograms('p', '2026-11-15')).result.current).toEqual({ previous: undefined, next: undefined })
  })
})
