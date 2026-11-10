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
    const { container } = render(<ScoreViewer status="ready" scoreKey="a" svgPages={[page('a'), page('b')]} title="Kinh Hòa Bình" />)
    const region = await findSheet()
    expect(region).toHaveAttribute('tabindex', '0')
    expect(region.querySelectorAll('svg')).toHaveLength(2)
    expect(region.querySelector('#a.note')).not.toBeNull()
    expect(container.querySelectorAll('.hm-score-scroll')).toHaveLength(1)
    expect(screen.getByText('Kinh Hòa Bình, 2 trang')).toBeInTheDocument()
  })

  it('ready never mounts unsafe markup', async () => {
    const evil = '<svg xmlns="http://www.w3.org/2000/svg" onload="x()"><script>x()</script><rect/></svg>'
    render(<ScoreViewer status="ready" scoreKey="a" svgPages={[evil]} />)
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
        <ScoreViewer status="ready" scoreKey="a" svgPages={[scored]} />
      </>,
    )
    const region = await findSheet()
    const css = region.querySelector('style')?.textContent ?? ''
    const selector = css.slice(0, css.indexOf('{'))
    expect(selector).toBe('.hm-score-page g.note')
    expect(Array.from(document.querySelectorAll(selector))).toEqual([region.querySelector('g.note')])
  })

  it('new svgPages keep the same scroll region and its scroll position', async () => {
    const { rerender } = render(<ScoreViewer status="ready" scoreKey="a" svgPages={[page('a')]} />)
    const region = await findSheet()
    region.scrollTop = 300
    rerender(<ScoreViewer status="ready" scoreKey="a" svgPages={[page('b')]} />)
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
    ['a page with a DTD', [`<!DOCTYPE svg [<!ENTITY a "AAAA">]><svg xmlns="http://www.w3.org/2000/svg"><text>&a;&a;</text></svg>`]],
  ])('%s shows the error state without parsing anything', async (_name, svgPages) => {
    const parse = parseSpy()
    const onRetry = vi.fn()
    render(<ScoreViewer status="ready" scoreKey="a" svgPages={svgPages} onRetry={onRetry} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('quá lớn')
    await settle()
    expect(parse).not.toHaveBeenCalled()
    expect(screen.queryByRole('group', { name: 'Bản nhạc' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Thử lại/ }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('offers no "Thử lại" for a refused score when the caller gave no onRetry: retrying alone cannot help', async () => {
    render(<ScoreViewer status="ready" scoreKey="a" svgPages={[oversized]} />)
    await screen.findByRole('alert')
    expect(screen.queryByRole('button', { name: /Thử lại/ })).toBeNull()
  })

  it('a page the sanitizer cannot read shows the error state, not a blank page', async () => {
    render(<ScoreViewer status="ready" scoreKey="a" svgPages={['<svg']} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('không hợp lệ')
  })

  describe('checks after parsing (the parser is stubbed to expand, as the preflight now stops every real DTD)', () => {
    const realParse = DOMParser.prototype.parseFromString
    const parserExpandsTo = (svg: string) =>
      vi.spyOn(DOMParser.prototype, 'parseFromString').mockImplementation(function (this: DOMParser, _input, type) {
        return realParse.call(this, svg, type)
      })
    const svgns = 'xmlns="http://www.w3.org/2000/svg"'

    it('a page that expands past the size limit shows the error state and is not kept', async () => {
      parserExpandsTo(`<svg ${svgns}><text id="expanded">${'x'.repeat(MAX_PAGE_CHARS)}</text></svg>`)
      const { container } = render(<ScoreViewer status="ready" scoreKey="a" svgPages={[page('a')]} />)
      await screen.findByRole('alert')
      expect(container.querySelector('#expanded')).toBeNull()
    })

    it(
      'pages that expand past the total show the error state and are not kept',
      async () => {
        parserExpandsTo(`<svg ${svgns}><text id="expanded">${'x'.repeat(MAX_PAGE_CHARS - 200)}</text></svg>`)
        const pages = Array.from({ length: Math.floor(MAX_TOTAL_CHARS / MAX_PAGE_CHARS) + 2 }, (_, index) => page(`p${index}`))
        const { container } = render(<ScoreViewer status="ready" scoreKey="a" svgPages={pages} />)
        await screen.findByRole('alert', {}, { timeout: 12_000 })
        expect(container.querySelector('#expanded')).toBeNull()
      },
      15_000,
    )
  })

  describe('scoreKey', () => {
    it('status="ready" requires a scoreKey (checked by tsc)', async () => {
      // @ts-expect-error `status="ready"` requires `scoreKey`; `npm run typecheck` fails if this line ever compiles.
      render(<ScoreViewer status="ready" svgPages={[page('a')]} />)
      await findSheet()
    })

    it('another score shows loading at once, with nothing of the old one in the DOM', async () => {
      const { rerender, container } = render(<ScoreViewer status="ready" scoreKey="A" svgPages={[page('from-a')]} />)
      await findSheet()
      rerender(<ScoreViewer status="ready" scoreKey="B" svgPages={[page('from-b')]} />)
      expect(container.querySelector('#from-a')).toBeNull()
      expect(screen.getByLabelText('Đang tải bản nhạc')).toBeInTheDocument()
      expect((await findSheet()).querySelector('#from-b')).not.toBeNull()
      expect(container.querySelector('#from-a')).toBeNull()
    })

    it('a new key filters again even when the pages array is the same one', async () => {
      const shared = [page('shared')]
      const { rerender } = render(<ScoreViewer status="ready" scoreKey="A" svgPages={shared} />)
      await findSheet()
      rerender(<ScoreViewer status="ready" scoreKey="B" svgPages={shared} />)
      expect(screen.getByLabelText('Đang tải bản nhạc')).toBeInTheDocument()
      expect((await findSheet()).querySelector('#shared')).not.toBeNull()
    })

    it('a refused score does not carry its error over to the next one', async () => {
      const { rerender } = render(<ScoreViewer status="ready" scoreKey="A" svgPages={[oversized]} />)
      await screen.findByRole('alert')
      rerender(<ScoreViewer status="ready" scoreKey="B" svgPages={[page('from-b')]} />)
      expect(screen.queryByRole('alert')).toBeNull()
      expect(screen.getByLabelText('Đang tải bản nhạc')).toBeInTheDocument()
    })

    it('the same score with new pages keeps the filtered ones until the new ones are ready', async () => {
      const { rerender, container } = render(<ScoreViewer status="ready" scoreKey="A" svgPages={[page('before')]} />)
      await findSheet()
      rerender(<ScoreViewer status="ready" scoreKey="A" svgPages={[page('after')]} />)
      expect(container.querySelector('#before')).not.toBeNull()
      await waitFor(() => expect(container.querySelector('#after')).not.toBeNull())
      expect(container.querySelector('#before')).toBeNull()
    })

    it('A → B → A in a row lets only the last run land', async () => {
      const parse = parseSpy()
      const slow = [page('a-old1'), page('a-old2'), page('a-old3')]
      const { rerender, container } = render(<ScoreViewer status="ready" scoreKey="A" svgPages={slow} />)
      rerender(<ScoreViewer status="ready" scoreKey="B" svgPages={[page('from-b')]} />)
      rerender(<ScoreViewer status="ready" scoreKey="A" svgPages={[page('a-new')]} />)
      await findSheet()
      await settle()
      expect(container.querySelector('#a-new')).not.toBeNull()
      expect(container.querySelector('#a-old1')).toBeNull()
      expect(container.querySelector('#from-b')).toBeNull()
      expect(parse).toHaveBeenCalledTimes(1)
    })

    it('a result for the old score cannot land under the new one', async () => {
      const { rerender, container } = render(<ScoreViewer status="ready" scoreKey="A" svgPages={[page('from-a'), page('from-a2')]} />)
      rerender(<ScoreViewer status="ready" scoreKey="B" svgPages={[page('from-b')]} />)
      await findSheet()
      await settle()
      expect(container.querySelector('#from-b')).not.toBeNull()
      expect(container.querySelector('#from-a')).toBeNull()
    })
  })

  it('recovers from the error state when smaller pages arrive', async () => {
    const { rerender } = render(<ScoreViewer status="ready" scoreKey="a" svgPages={[oversized]} />)
    await screen.findByRole('alert')
    rerender(<ScoreViewer status="ready" scoreKey="a" svgPages={[page('small')]} />)
    expect((await findSheet()).querySelector('#small')).not.toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('shows the loading state, never the raw SVG, until the pages are filtered', async () => {
    const raw = '<svg xmlns="http://www.w3.org/2000/svg" id="raw-page" onload="x()"><rect/></svg>'
    const { container } = render(<ScoreViewer status="ready" scoreKey="a" svgPages={[raw]} />)
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

    render(<ScoreViewer status="ready" scoreKey="a" svgPages={[page('a'), page('b'), page('c')]} />)
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
    const { rerender, container } = render(<ScoreViewer status="ready" scoreKey="a" svgPages={[page('old1'), page('old2'), page('old3')]} />)
    rerender(<ScoreViewer status="ready" scoreKey="a" svgPages={[page('new')]} />)
    await findSheet()
    await settle()
    expect(container.querySelector('#new')).not.toBeNull()
    expect(container.querySelector('#old1')).toBeNull()
    expect(parse).toHaveBeenCalledTimes(1)
  })

  it('unmounting in the middle stops the work and reports nothing', async () => {
    const parse = parseSpy()
    const consoleError = vi.spyOn(console, 'error')
    const { unmount } = render(<ScoreViewer status="ready" scoreKey="a" svgPages={[page('a'), page('b')]} />)
    unmount()
    await settle()
    expect(parse).not.toHaveBeenCalled()
    expect(consoleError).not.toHaveBeenCalled()
  })

  it('forgets the filtered pages when the status leaves ready, so a new score starts from loading', async () => {
    const { rerender, container } = render(<ScoreViewer status="ready" scoreKey="a" svgPages={[page('first')]} />)
    await findSheet()
    rerender(<ScoreViewer status="loading" svgPages={[]} />)
    rerender(<ScoreViewer status="ready" scoreKey="a" svgPages={[page('second')]} />)
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
    render(<ScoreViewer status="ready" scoreKey="a" svgPages={[page('a')]} onWidthChange={onWidthChange} />)
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
    rerender(<ScoreViewer status="ready" scoreKey="a" svgPages={[page('a')]} />)
    rerender(<ScoreViewer status="error" svgPages={[]} onRetry={() => {}} />)
    expect(FakeResizeObserver.instances.filter((o) => !o.disconnected)).toHaveLength(1)
  })
})

describe('ScoreViewer onRefused', () => {
  const oversized = '<svg>' + ' '.repeat(MAX_PAGE_CHARS) + '</svg>'
  /** Lets the filter's per-page tasks run to the end. */
  const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 50)))

  it.each([
    ['too large for the preflight', oversized],
    ['not an SVG once sanitized', '<html xmlns="http://www.w3.org/1999/xhtml"/>'],
  ])('tells the caller once when the pages are refused: %s', async (_name, refused) => {
    const onRefused = vi.fn()
    render(<ScoreViewer status="ready" scoreKey="a" svgPages={[refused]} onRefused={onRefused} />)
    await screen.findByText('Không thể hiển thị bản nhạc')
    await settle()
    expect(onRefused).toHaveBeenCalledTimes(1)
  })

  it('says nothing for pages that pass', async () => {
    const onRefused = vi.fn()
    render(<ScoreViewer status="ready" scoreKey="a" svgPages={[page('a')]} onRefused={onRefused} />)
    await findSheet()
    await settle()
    expect(onRefused).not.toHaveBeenCalled()
  })

  it('says nothing for refused pages replaced before they were filtered', async () => {
    const onRefused = vi.fn()
    const { rerender } = render(<ScoreViewer status="ready" scoreKey="a" svgPages={[oversized]} onRefused={onRefused} />)
    rerender(<ScoreViewer status="ready" scoreKey="a" svgPages={[page('a')]} onRefused={onRefused} />)
    await findSheet()
    await settle()
    expect(onRefused).not.toHaveBeenCalled()
  })

  it('says nothing after unmount', async () => {
    const onRefused = vi.fn()
    const view = render(<ScoreViewer status="ready" scoreKey="a" svgPages={[oversized]} onRefused={onRefused} />)
    view.unmount()
    await settle()
    expect(onRefused).not.toHaveBeenCalled()
  })
})
