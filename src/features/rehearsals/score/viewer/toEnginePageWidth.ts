/**
 * Verovio units per CSS px of page width. At scale 1 Verovio draws the notation large enough that a 1440px window holds
 * only two or three bars per system; 1.3 keeps the staff and the Vietnamese lyrics easy to read at 1440px with a few
 * more bars (checked with sample.mxl, P4 2026-11-08). The SVG is then drawn 1.3× wider than the sheet and scaled
 * down to fit it by `max-width: 100%`.
 */
export const SCORE_LAYOUT_SCALE = 1.3

/**
 * Narrowest page handed to Verovio for a sheet at least `NARROW_CONTENT_PX` wide (its own floor is 100): below this a
 * system holds barely one bar. A sheet that narrow gets a wider page, scaled down to fit it.
 */
export const MIN_ENGINE_PAGE_WIDTH = 400

/**
 * Content width (CSS px, what `ScoreViewer.onWidthChange` reports) under which the sheet is a phone's. Measured in P7 fix 2
 * (Chromium, 375 px window): the sheet is 222 px in normal mode and 285 px in focus mode; the narrowest sheet of a 768 px
 * window is 327 px (normal mode). 300 splits them, so a phone scrolls and a 768 px window never does. The same number, plus
 * the 66 px of sheet padding and border, is the `@container` width in `ScoreViewer.css` (`scoreCss.test.ts` keeps them equal).
 */
export const NARROW_CONTENT_PX = 300

/**
 * Page (Verovio units) of a phone-width sheet: wide enough that a system holds a bar with its part label, clef, time
 * signature and two lines of lyrics without Verovio squeezing the notes and syllables into a column (its "Justification
 * is highly compressed" warning, ratio 0.05 at the old 400). The sheet is narrower than the page and scrolls sideways
 * (`.hm-score-scroll`, `overflow-x: auto`), the page keeping its natural size. How it was chosen: P7 fix 2 report.
 */
export const PHONE_ENGINE_PAGE_WIDTH = 750

/**
 * Maps the width `ScoreViewer.onWidthChange` reports (CSS px) to Verovio's `pageWidth`, for `load` and `relayout`. A
 * phone-width sheet gets `PHONE_ENGINE_PAGE_WIDTH` (and scrolls); every other sheet gets `SCORE_LAYOUT_SCALE` times its
 * width, at least `MIN_ENGINE_PAGE_WIDTH`, and the page is shrunk to fit it (no scroll). A width that is not a positive
 * number (the viewer never reports one) gives the minimum.
 */
export function toEnginePageWidth(contentWidthPx: number): number {
  if (!Number.isFinite(contentWidthPx) || contentWidthPx <= 0) return MIN_ENGINE_PAGE_WIDTH
  if (contentWidthPx < NARROW_CONTENT_PX) return PHONE_ENGINE_PAGE_WIDTH
  return Math.max(MIN_ENGINE_PAGE_WIDTH, Math.round(contentWidthPx * SCORE_LAYOUT_SCALE))
}
