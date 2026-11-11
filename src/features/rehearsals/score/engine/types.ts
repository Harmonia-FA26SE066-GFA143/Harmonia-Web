import type { AliasMap, RawTimemapEntry } from '../timeline/types'

/** Score file as read from the source. `mxl` is the zipped MusicXML container, so it is always bytes. */
export type ScoreInput = { format: 'musicxml'; data: string | Uint8Array } | { format: 'mxl'; data: Uint8Array }

export interface LayoutOptions {
  /** Verovio page width (its own units, not CSS px). */
  pageWidth: number
}

/** Everything comes from one load: Verovio gives new random `xml:id`s on every load. */
export interface LoadedScore {
  svgPages: string[]
  mei: string
  /** Raw `renderToTimemap()` output, for `parseTimemap`. */
  timemap: RawTimemapEntry[]
  /** Repeat id (`-rendN`) -> the original note id the SVG has, for `parseTimemap`. Only ids that differ are listed. */
  aliases: AliasMap
}

export interface ScoreEngine {
  /** The latest call wins: an earlier call that has not started parsing rejects with `superseded`. */
  load(input: ScoreInput, options: LayoutOptions): Promise<LoadedScore>
  /**
   * Redraws the loaded score at a new width without parsing it again. Runs synchronously on the UI thread and can
   * block it for a score with many pages: callers must debounce resize and never call it during render or animation.
   */
  relayout(pageWidth: number): string[]
  /** Frees the toolkit. Safe to call more than once; never throws (a failing destructor is swallowed). */
  dispose(): void
}

/** `too-complex`: more notes than `MAX_SCORE_NOTES`; the score is refused, not tried again. */
export type ScoreEngineErrorCode = 'init-failed' | 'load-failed' | 'render-failed' | 'not-loaded' | 'disposed' | 'superseded' | 'too-complex'

/** The only error the engine throws. The library's own error, if any, stays in `cause` for logging, never in `message`. */
export class ScoreEngineError extends Error {
  readonly code: ScoreEngineErrorCode

  constructor(code: ScoreEngineErrorCode, cause?: unknown) {
    super(`Score engine: ${code}`, { cause })
    this.name = 'ScoreEngineError'
    this.code = code
  }
}

/** The part of Verovio's `VerovioToolkit` the engine uses; tests pass a fake. */
export interface ScoreToolkit {
  setOptions(options: { pageWidth: number; adjustPageHeight: boolean }): boolean
  loadData(data: string): boolean
  loadZipDataBuffer(data: ArrayBuffer): boolean
  getPageCount(): number
  renderToSVG(pageNo: number): string
  renderToTimemap(options: { includeMeasures: boolean }): RawTimemapEntry[]
  getMEI(): string
  /**
   * At runtime (6.4.1) an array: the original id first, then its repeat copies. Verovio's typings declare an object, so
   * the engine checks the shape instead of trusting either.
   */
  getExpansionIdsForElement(id: string): unknown
  redoLayout(): void
  destroy(): void
}
