import { useEffect, useId, useMemo, useRef, type CSSProperties } from 'react'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { colors, radius, spacing } from '@/styles/tokens'
import { sanitizeSvg } from './sanitizeSvg'
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
}

/** The error state always offers "Thử lại", so a caller that can reach it has to say what retrying does. */
export type ScoreViewerProps = ScoreViewerBaseProps &
  ({ status: 'error'; onRetry: () => void } | { status: Exclude<ScoreViewerStatus, 'error'>; onRetry?: () => void })

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
  '--hm-score-active': colors.primary,
  '--hm-score-focus': colors.primary,
  '--hm-score-radius': `${radius.lg}px`,
  '--hm-score-pad': `${spacing.xl}px`,
  '--hm-score-gap': `${spacing.lg}px`,
} as CSSProperties

/**
 * Shows the rendered score on a flat ivory sheet in one scroll region. It does no fetching: the caller passes the state
 * and the pages. Hooks for P5/P7: `hm-score-note--active` on a note group, `hm-score-lyric--active` on a syllable.
 * The scroll region stays mounted while the status is `ready`, so new pages (relayout) keep the scroll position; the
 * browser only clamps it when the score gets shorter.
 */
export function ScoreViewer({ status, svgPages, title, onRetry, onWidthChange }: Readonly<ScoreViewerProps>) {
  const rootRef = useRef<HTMLDivElement>(null)
  const onWidthChangeRef = useRef(onWidthChange)
  const summaryId = useId()
  const pages = useMemo(() => svgPages.map(sanitizeSvg), [svgPages])

  useEffect(() => {
    onWidthChangeRef.current = onWidthChange
  }, [onWidthChange])

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

  const pageCount = `${pages.length} trang`
  return (
    <div ref={rootRef} className="hm-score-viewer" style={themeVars}>
      {status === 'loading' && (
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
        </output>
      )}
      {status === 'empty' && (
        <EmptyState title="Chưa có bản nhạc" description="Bài này chưa có bản nhạc để hiển thị." />
      )}
      {status === 'error' && (
        <ErrorState
          title="Không thể hiển thị bản nhạc"
          description="Đã xảy ra sự cố khi mở bản nhạc. Vui lòng thử lại."
          onRetry={onRetry}
        />
      )}
      {status === 'ready' && (
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
