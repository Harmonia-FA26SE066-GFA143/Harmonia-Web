import type { RawTimemapEntry } from '../timeline/types'

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

export type ScoreEngineErrorCode = 'init-failed' | 'load-failed' | 'render-failed' | 'not-loaded' | 'disposed' | 'superseded'

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
  setOptions(options: { pageWidth: number }): boolean
  loadData(data: string): boolean
  loadZipDataBuffer(data: ArrayBuffer): boolean
  getPageCount(): number
  renderToSVG(pageNo: number): string
  renderToTimemap(options: { includeMeasures: boolean }): RawTimemapEntry[]
  getMEI(): string
  redoLayout(): void
  destroy(): void
}
