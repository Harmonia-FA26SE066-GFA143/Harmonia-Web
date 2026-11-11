import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { colors, radius, spacing } from '@/styles/tokens'
import { failsSvgPreflight, sanitizeSvg } from './sanitizeSvg'
import './ScoreViewer.css'

export type ScoreViewerStatus = 'loading' | 'empty' | 'error' | 'ready'

interface ScoreViewerBaseProps {
  /** Pages from `ScoreEngine.load`/`relayout`. Sanitized here before they are mounted. */
  svgPages: string[]
  /** Song title for the screen-reader summary, when known. */
  title?: string
  /**
   * The width a page can use inside the sheet, in CSS px, after resizing settles: once on first layout, then only when
   * it changes by `WIDTH_STEP_PX` or more. The caller maps it to Verovio units and decides whether to `relayout`.
   */
  onWidthChange?: (width: number) => void
  /**
   * Called once when the filter refuses the pages it was given (too large, or not a clean SVG), so the caller can leave
   * its ready state. Never for pages that were replaced or unmounted before their filtering finished.
   */
  onRefused?: () => void
}

/**
 * `status: 'error'` offers "Thử lại", so its caller has to say what retrying does. A score the viewer refuses while
 * `ready` shows the button only when `onRetry` is given; retrying the same pages could not help.
 * `scoreKey` names the score behind `svgPages`: the same key with new pages is a relayout, a new key is another score.
 */
export type ScoreViewerProps = ScoreViewerBaseProps &
  (
    | { status: 'error'; onRetry: () => void; scoreKey?: string }
    | { status: 'ready'; scoreKey: string; onRetry?: () => void }
    | { status: 'loading' | 'empty'; onRetry?: () => void; scoreKey?: string }
  )

const DEBOUNCE_MS = 200
const WIDTH_STEP_PX = 16
/** Sheet padding and 1px border on both sides (see `.hm-score-sheet`).
 * ponytail: a classic scrollbar (Windows, ~15px) is not subtracted; `max-width: 100%` shrinks the page by that much. */
const SHEET_CHROME_PX = 2 * (spacing.xl + 1)

// Tokens reach the stylesheet as custom properties, so the CSS holds no colour of its own.
const themeVars = {
  '--hm-score-paper': colors.ivory,
  '--hm-score-border': colors.border,
  '--hm-score-ink': colors.textPrimary,
  '--hm-score-muted': colors.textMuted,
  '--hm-score-active': colors.primary,
  '--hm-score-focus': colors.primary,
  '--hm-score-radius': `${radius.lg}px`,
  '--hm-score-pad': `${spacing.xl}px`,
  '--hm-score-gap': `${spacing.lg}px`,
} as CSSProperties

const REFUSED = 'refused'
type FilterResult = string[] | typeof REFUSED
const yieldToBrowser = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

function visibleState(status: ScoreViewerStatus, result: FilterResult | undefined): ScoreViewerStatus {
  if (status !== 'ready') return status
  if (result === REFUSED) return 'error'
  return result ? 'ready' : 'loading'
}

/**
 * Shows the rendered score on a flat ivory sheet in one scroll region. It does no fetching: the caller passes the state
 * and the pages. Hooks for P5/P7: `hm-score-note--active` on a note group, `hm-score-lyric--active` on a syllable.
 * Pages are filtered after render, one per task; nothing unfiltered ever reaches the DOM. Until the first result the
 * loading state shows. While new pages of the same `scoreKey` (relayout) are filtered the previous, already filtered ones
 * stay, so the scroll region stays mounted and keeps its position; the browser only clamps it when the score gets shorter.
 */
export function ScoreViewer({ status, scoreKey, svgPages, title, onRetry, onWidthChange, onRefused }: Readonly<ScoreViewerProps>) {
  const rootRef = useRef<HTMLDivElement>(null)
  const onWidthChangeRef = useRef(onWidthChange)
  const onRefusedRef = useRef(onRefused)
  const summaryId = useId()
  const [filtered, setFiltered] = useState<{ scoreKey: string; result: FilterResult } | null>(null)
  // Another score, or leaving `ready`: start from loading before anything of these pages is committed again.
  if (filtered !== null && (status !== 'ready' || filtered.scoreKey !== scoreKey)) setFiltered(null)

  useEffect(() => {
    onWidthChangeRef.current = onWidthChange
    onRefusedRef.current = onRefused
  }, [onWidthChange, onRefused])

  useEffect(() => {
    if (status !== 'ready') return
    // Another key, new pages or an unmount end this run: nothing is parsed or set after the next yield.
    let superseded = false
    const stillWantedAfterYield = async () => {
      await yieldToBrowser()
      return !superseded
    }
    // Only reached by a run still wanted after its last yield, so a replaced or unmounted run never reports.
    const finish = (result: FilterResult) => {
      setFiltered({ scoreKey, result })
      if (result === REFUSED) onRefusedRef.current?.()
    }
    void (async () => {
      if (!(await stillWantedAfterYield())) return
      if (failsSvgPreflight(svgPages)) {
        finish(REFUSED)
        return
      }
      const clean: string[] = []
      for (const page of svgPages) {
        if (!(await stillWantedAfterYield())) return
        const sanitized = sanitizeSvg(page)
        if (!sanitized) {
          finish(REFUSED)
          return
        }
        clean.push(sanitized)
      }
      finish(failsSvgPreflight(clean) ? REFUSED : clean)
    })()
    return () => {
      superseded = true
    }
  }, [status, scoreKey, svgPages])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let timer: ReturnType<typeof setTimeout> | undefined
    let reported: number | undefined
    const observer = new window.ResizeObserver((entries) => {
      const width = Math.round((entries[0]?.contentRect.width ?? 0) - SHEET_CHROME_PX)
      clearTimeout(timer)
      timer = setTimeout(() => {
        if (width <= 0 || (reported !== undefined && Math.abs(width - reported) < WIDTH_STEP_PX)) return
        reported = width
        onWidthChangeRef.current?.(width)
      }, DEBOUNCE_MS)
    })
    observer.observe(root)
    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [])

  const view = visibleState(status, filtered?.result)
  const pages = Array.isArray(filtered?.result) ? filtered.result : []
  const pageCount = `${pages.length} trang`
  return (
    <div ref={rootRef} className="hm-score-viewer" style={themeVars}>
      {view === 'loading' && (
        <output aria-busy="true" aria-label="Đang tải bản nhạc" className="hm-score-sheet hm-score-skeleton hm-skeleton-in">
          {/* Bare staves the width of the sheet, where the systems will be (StaffPlaceholder is incipit-long). */}
          {Array.from({ length: 4 }, (_, index) => (
            <svg key={index} aria-hidden width="100%" height={33} style={{ display: 'block' }}>
              <g stroke={colors.primary} strokeOpacity={0.18} strokeWidth={1}>
                {[0, 8, 16, 24, 32].map((y) => (
                  <line key={y} x1="0" x2="100%" y1={y + 0.5} y2={y + 0.5} />
                ))}
              </g>
            </svg>
          ))}
          {/* Loading can take seconds (the engine draws every page at once): say so in words, not only to screen readers. */}
          <span className="hm-score-loading-text">Đang dựng bản nhạc, có thể mất vài giây.</span>
        </output>
      )}
      {view === 'empty' && (
        <EmptyState title="Chưa có bản nhạc" description="Bài này chưa có bản nhạc để hiển thị." />
      )}
      {view === 'error' && (
        <ErrorState
          title="Không thể hiển thị bản nhạc"
          description={
            filtered?.result === REFUSED
              ? 'Bản nhạc này quá lớn hoặc không hợp lệ nên không thể hiển thị. Vui lòng dùng bản khác.'
              : 'Đã xảy ra sự cố khi mở bản nhạc. Vui lòng thử lại.'
          }
          onRetry={onRetry}
        />
      )}
      {view === 'ready' && (
        <>
          <p id={summaryId} className="hm-score-sr">
            {title ? `${title}, ${pageCount}` : `Bản nhạc ${pageCount}`}
          </p>
          {/* Focusable so arrow keys and Page Up/Down scroll it; no key is captured, Tab leaves as usual. */}
          <div
            className="hm-score-sheet hm-score-scroll"
            role="group"
            aria-label="Bản nhạc"
            aria-describedby={summaryId}
            tabIndex={0}
          >
            {pages.map((svg, index) => (
              // Pages have no identity of their own: a relayout replaces them all, in order.
              <div key={index} className="hm-score-page" dangerouslySetInnerHTML={{ __html: svg }} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
