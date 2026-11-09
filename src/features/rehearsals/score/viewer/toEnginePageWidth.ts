/**
 * Verovio units per CSS px of page width. At scale 1 Verovio draws the notation large enough that a 1440px window holds
 * only two or three bars per system; 1.3 keeps the staff and the Vietnamese lyrics easy to read at 1440px with a few
 * more bars (checked with sample.mxl, P4 2026-11-08). The SVG is then drawn 1.3× wider than the sheet and scaled
 * down to fit it by `max-width: 100%`.
 */
export const SCORE_LAYOUT_SCALE = 1.3

/**
 * Narrowest page handed to Verovio (its own floor is 100): below this a system holds barely one bar. A sheet that
 * narrow gets a wider page, scaled down to fit.
 */
export const MIN_ENGINE_PAGE_WIDTH = 400

/** Maps the width `ScoreViewer.onWidthChange` reports (CSS px) to Verovio's `pageWidth`, for `load` and `relayout`. */
export function toEnginePageWidth(contentWidthPx: number): number {
  if (!Number.isFinite(contentWidthPx)) return MIN_ENGINE_PAGE_WIDTH
  return Math.max(MIN_ENGINE_PAGE_WIDTH, Math.round(contentWidthPx * SCORE_LAYOUT_SCALE))
}
