import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ScoreViewer } from './ScoreViewer'

// A ResizeObserver the test drives by hand: jsdom has no layout.
class FakeResizeObserver {
  static instances: FakeResizeObserver[] = []
  observed: Element[] = []
  disconnected = false
  private readonly callback: ResizeObserverCallback
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
    FakeResizeObserver.instances.push(this)
  }
  observe(target: Element) {
    this.observed.push(target)
  }
  unobserve() {}
  disconnect() {
    this.disconnected = true
  }
  resize(width: number) {
    const entry = { target: this.observed[0], contentRect: { width } } as unknown as ResizeObserverEntry
    this.callback([entry], this as unknown as ResizeObserver)
  }
}

const page = (id: string) => `<svg xmlns="http://www.w3.org/2000/svg"><g id="${id}" class="note"><path d="M0 0"/></g></svg>`

let original: typeof ResizeObserver

beforeEach(() => {
  original = window.ResizeObserver
  FakeResizeObserver.instances = []
  window.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver
})

afterEach(() => {
  window.ResizeObserver = original
  vi.useRealTimers()
})

describe('ScoreViewer states', () => {
  it('loading shows a busy placeholder, no score region', () => {
    render(<ScoreViewer status="loading" svgPages={[]} />)
    expect(screen.getByLabelText('Đang tải bản nhạc')).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByRole('group', { name: 'Bản nhạc' })).toBeNull()
  })

  it('empty shows the empty state', () => {
    render(<ScoreViewer status="empty" svgPages={[]} />)
    expect(screen.getByRole('status')).toHaveTextContent('Chưa có bản nhạc')
  })

  it('the error state cannot be used without onRetry, so "Thử lại" is always there (checked by tsc)', () => {
    // @ts-expect-error `status="error"` requires `onRetry`; `npm run typecheck` fails if this line ever compiles.
    render(<ScoreViewer status="error" svgPages={[]} />)
    expect(screen.getByText('Không thể hiển thị bản nhạc')).toBeInTheDocument()
  })

  it('error shows the error state and "Thử lại" calls onRetry', () => {
    const onRetry = vi.fn()
    render(<ScoreViewer status="error" svgPages={[]} onRetry={onRetry} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Không thể hiển thị bản nhạc')
    fireEvent.click(screen.getByRole('button', { name: /Thử lại/ }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('ready draws every page inside exactly one focusable scroll region with a text summary', () => {
    const { container } = render(<ScoreViewer status="ready" svgPages={[page('a'), page('b')]} title="Kinh Hòa Bình" />)
    const region = screen.getByRole('group', { name: 'Bản nhạc' })
    expect(region).toHaveAttribute('tabindex', '0')
    expect(region.querySelectorAll('svg')).toHaveLength(2)
    expect(region.querySelector('#a.note')).not.toBeNull()
    expect(container.querySelectorAll('.hm-score-scroll')).toHaveLength(1)
    expect(screen.getByText('Kinh Hòa Bình, 2 trang')).toBeInTheDocument()
  })

  it('ready never mounts unsafe markup', () => {
    const evil = '<svg xmlns="http://www.w3.org/2000/svg" onload="x()"><script>x()</script><rect/></svg>'
    render(<ScoreViewer status="ready" svgPages={[evil]} />)
    const region = screen.getByRole('group', { name: 'Bản nhạc' })
    expect(region.querySelector('script')).toBeNull()
    expect(region.querySelector('[onload]')).toBeNull()
    expect(region.querySelector('rect')).not.toBeNull()
  })

  it('ready applies the score CSS to its own page and to nothing around it', () => {
    const scored = '<svg xmlns="http://www.w3.org/2000/svg"><style>g.note{fill:red}</style><g class="note"/></svg>'
    render(
      <>
        <svg>
          <g className="note" />
        </svg>
        <ScoreViewer status="ready" svgPages={[scored]} />
      </>,
    )
    const region = screen.getByRole('group', { name: 'Bản nhạc' })
    const css = region.querySelector('style')?.textContent ?? ''
    const selector = css.slice(0, css.indexOf('{'))
    expect(selector).toBe('.hm-score-page g.note')
    expect(Array.from(document.querySelectorAll(selector))).toEqual([region.querySelector('g.note')])
  })

  it('new svgPages keep the same scroll region and its scroll position', () => {
    const { rerender } = render(<ScoreViewer status="ready" svgPages={[page('a')]} />)
    const region = screen.getByRole('group', { name: 'Bản nhạc' })
    region.scrollTop = 300
    rerender(<ScoreViewer status="ready" svgPages={[page('b')]} />)
    expect(screen.getByRole('group', { name: 'Bản nhạc' })).toBe(region)
    expect(region.scrollTop).toBe(300)
    expect(region.querySelector('#b')).not.toBeNull()
  })
})

describe('ScoreViewer resize', () => {
  // 66 = the sheet's padding (2 × 32) and border (2 × 1): the width a page can use.
  it('reports the width once after the debounce, then only for large enough changes', () => {
    vi.useFakeTimers()
    const onWidthChange = vi.fn()
    render(<ScoreViewer status="ready" svgPages={[page('a')]} onWidthChange={onWidthChange} />)
    const observer = FakeResizeObserver.instances.at(-1)!

    // A drag of the window: sizes arrive closer together than the debounce.
    act(() => {
      observer.resize(900)
      vi.advanceTimersByTime(100)
      observer.resize(1000)
      vi.advanceTimersByTime(100)
      observer.resize(1100)
      vi.advanceTimersByTime(100)
    })
    expect(onWidthChange).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(250))
    expect(onWidthChange).toHaveBeenCalledTimes(1)
    expect(onWidthChange).toHaveBeenLastCalledWith(1100 - 66)

    act(() => {
      observer.resize(1104)
      vi.advanceTimersByTime(250)
    })
    expect(onWidthChange).toHaveBeenCalledTimes(1)

    act(() => {
      observer.resize(800)
      vi.advanceTimersByTime(250)
    })
    expect(onWidthChange).toHaveBeenCalledTimes(2)
    expect(onWidthChange).toHaveBeenLastCalledWith(800 - 66)
  })

  it('unmount disconnects the observer and drops a pending report', () => {
    vi.useFakeTimers()
    const onWidthChange = vi.fn()
    const { unmount } = render(<ScoreViewer status="loading" svgPages={[]} onWidthChange={onWidthChange} />)
    const observer = FakeResizeObserver.instances.at(-1)!
    act(() => observer.resize(1000))
    unmount()
    expect(observer.disconnected).toBe(true)
    vi.advanceTimersByTime(1000)
    expect(onWidthChange).not.toHaveBeenCalled()
  })

  it('keeps one observer across state changes', () => {
    const { rerender } = render(<ScoreViewer status="loading" svgPages={[]} />)
    rerender(<ScoreViewer status="ready" svgPages={[page('a')]} />)
    rerender(<ScoreViewer status="error" svgPages={[]} onRetry={() => {}} />)
    expect(FakeResizeObserver.instances.filter((o) => !o.disconnected)).toHaveLength(1)
  })
})
