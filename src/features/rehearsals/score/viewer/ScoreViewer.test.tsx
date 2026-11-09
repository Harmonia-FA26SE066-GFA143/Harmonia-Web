import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MAX_PAGE_CHARS, MAX_PAGE_TAGS, MAX_TOTAL_CHARS } from './sanitizeSvg'
import { ScoreViewer } from './ScoreViewer'

/** The score region appears once the pages are filtered, a few tasks after render. */
const findSheet = () => screen.findByRole('group', { name: 'Bản nhạc' })

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
  vi.restoreAllMocks()
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

  it('ready draws every page inside exactly one focusable scroll region with a text summary', async () => {
    const { container } = render(<ScoreViewer status="ready" svgPages={[page('a'), page('b')]} title="Kinh Hòa Bình" />)
    const region = await findSheet()
    expect(region).toHaveAttribute('tabindex', '0')
    expect(region.querySelectorAll('svg')).toHaveLength(2)
    expect(region.querySelector('#a.note')).not.toBeNull()
    expect(container.querySelectorAll('.hm-score-scroll')).toHaveLength(1)
    expect(screen.getByText('Kinh Hòa Bình, 2 trang')).toBeInTheDocument()
  })

  it('ready never mounts unsafe markup', async () => {
    const evil = '<svg xmlns="http://www.w3.org/2000/svg" onload="x()"><script>x()</script><rect/></svg>'
    render(<ScoreViewer status="ready" svgPages={[evil]} />)
    const region = await findSheet()
    expect(region.querySelector('script')).toBeNull()
    expect(region.querySelector('[onload]')).toBeNull()
    expect(region.querySelector('rect')).not.toBeNull()
  })

  it('ready applies the score CSS to its own page and to nothing around it', async () => {
    const scored = '<svg xmlns="http://www.w3.org/2000/svg"><style>g.note{fill:red}</style><g class="note"/></svg>'
    render(
      <>
        <svg>
          <g className="note" />
        </svg>
        <ScoreViewer status="ready" svgPages={[scored]} />
      </>,
    )
    const region = await findSheet()
    const css = region.querySelector('style')?.textContent ?? ''
    const selector = css.slice(0, css.indexOf('{'))
    expect(selector).toBe('.hm-score-page g.note')
    expect(Array.from(document.querySelectorAll(selector))).toEqual([region.querySelector('g.note')])
  })

  it('new svgPages keep the same scroll region and its scroll position', async () => {
    const { rerender } = render(<ScoreViewer status="ready" svgPages={[page('a')]} />)
    const region = await findSheet()
    region.scrollTop = 300
    rerender(<ScoreViewer status="ready" svgPages={[page('b')]} />)
    expect(screen.getByRole('group', { name: 'Bản nhạc' })).toBe(region)
    await waitFor(() => expect(region.querySelector('#b')).not.toBeNull())
    expect(screen.getByRole('group', { name: 'Bản nhạc' })).toBe(region)
    expect(region.scrollTop).toBe(300)
  })
})

describe('ScoreViewer filtering', () => {
  const parseSpy = () => vi.spyOn(DOMParser.prototype, 'parseFromString')
  const settle = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 30)))
  const oversized = '<svg>' + ' '.repeat(MAX_PAGE_CHARS) + '</svg>'

  it.each([
    ['a page past the size limit', [oversized]],
    ['a page with too many elements', [`<svg>${'<g/>'.repeat(MAX_PAGE_TAGS)}</svg>`]],
    ['pages past the total', Array.from({ length: Math.floor(MAX_TOTAL_CHARS / MAX_PAGE_CHARS) + 1 }, () => 'x'.repeat(MAX_PAGE_CHARS))],
  ])('%s shows the error state without parsing anything', async (_name, svgPages) => {
    const parse = parseSpy()
    const onRetry = vi.fn()
    render(<ScoreViewer status="ready" svgPages={svgPages} onRetry={onRetry} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('quá lớn')
    await settle()
    expect(parse).not.toHaveBeenCalled()
    expect(screen.queryByRole('group', { name: 'Bản nhạc' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Thử lại/ }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('still offers "Thử lại" for a score that is too large when the caller gave no onRetry', async () => {
    render(<ScoreViewer status="ready" svgPages={[oversized]} />)
    fireEvent.click(await screen.findByRole('button', { name: /Thử lại/ }))
    await settle()
    expect(screen.getByRole('alert')).toHaveTextContent('quá lớn')
  })

  it('recovers from the error state when smaller pages arrive', async () => {
    const { rerender } = render(<ScoreViewer status="ready" svgPages={[oversized]} />)
    await screen.findByRole('alert')
    rerender(<ScoreViewer status="ready" svgPages={[page('small')]} />)
    expect((await findSheet()).querySelector('#small')).not.toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('shows the loading state, never the raw SVG, until the pages are filtered', async () => {
    const raw = '<svg xmlns="http://www.w3.org/2000/svg" id="raw-page" onload="x()"><rect/></svg>'
    const { container } = render(<ScoreViewer status="ready" svgPages={[raw]} />)
    expect(screen.getByLabelText('Đang tải bản nhạc')).toHaveAttribute('aria-busy', 'true')
    expect(container.querySelector('#raw-page')).toBeNull()
    expect(container.innerHTML).not.toContain('onload')
    const region = await findSheet()
    expect(region.querySelector('#raw-page')).not.toBeNull()
    expect(container.innerHTML).not.toContain('onload')
  })

  it('filters one page per task, so the browser can paint in between', async () => {
    const tasks: (() => void)[] = []
    const realSetTimeout = globalThis.setTimeout
    vi.spyOn(globalThis, 'setTimeout').mockImplementation(((callback: () => void, delay?: number) => {
      if (delay === 0) tasks.push(callback)
      else return realSetTimeout(callback, delay)
    }) as typeof setTimeout)
    const parse = parseSpy()
    const runNextTask = () => act(async () => tasks.shift()?.())

    render(<ScoreViewer status="ready" svgPages={[page('a'), page('b'), page('c')]} />)
    expect(parse).toHaveBeenCalledTimes(0)
    await runNextTask() // the limits are checked in this task
    expect(parse).toHaveBeenCalledTimes(0)
    await runNextTask()
    expect(parse).toHaveBeenCalledTimes(1)
    await runNextTask()
    expect(parse).toHaveBeenCalledTimes(2)
    await runNextTask()
    expect(parse).toHaveBeenCalledTimes(3)
  })

  it('new svgPages make the earlier run stop, so a slower old result cannot replace them', async () => {
    const parse = parseSpy()
    const { rerender, container } = render(<ScoreViewer status="ready" svgPages={[page('old1'), page('old2'), page('old3')]} />)
    rerender(<ScoreViewer status="ready" svgPages={[page('new')]} />)
    await findSheet()
    await settle()
    expect(container.querySelector('#new')).not.toBeNull()
    expect(container.querySelector('#old1')).toBeNull()
    expect(parse).toHaveBeenCalledTimes(1)
  })

  it('unmounting in the middle stops the work and reports nothing', async () => {
    const parse = parseSpy()
    const consoleError = vi.spyOn(console, 'error')
    const { unmount } = render(<ScoreViewer status="ready" svgPages={[page('a'), page('b')]} />)
    unmount()
    await settle()
    expect(parse).not.toHaveBeenCalled()
    expect(consoleError).not.toHaveBeenCalled()
  })

  it('forgets the filtered pages when the status leaves ready, so a new score starts from loading', async () => {
    const { rerender, container } = render(<ScoreViewer status="ready" svgPages={[page('first')]} />)
    await findSheet()
    rerender(<ScoreViewer status="loading" svgPages={[]} />)
    rerender(<ScoreViewer status="ready" svgPages={[page('second')]} />)
    expect(container.querySelector('#first')).toBeNull()
    expect(screen.getByLabelText('Đang tải bản nhạc')).toBeInTheDocument()
    expect((await findSheet()).querySelector('#second')).not.toBeNull()
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
