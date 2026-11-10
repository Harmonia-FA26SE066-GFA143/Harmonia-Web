import type { RawTimemapEntry } from '../timeline/types'
import { ScoreEngineError, type ScoreEngine, type ScoreInput, type ScoreToolkit } from './types'

/**
 * Wraps a toolkit with a lifecycle. Verovio options stay as in the spike (docs/local/spikes/verovio): defaults plus
 * `pageWidth` and `adjustPageHeight` (`layoutOptions`), timemap with `includeMeasures`, `getMEI()` without options.
 * Repeats are left to Verovio's default expansion. The AliasMap is taken from the same load, since ids change on every
 * load; which pass to show on a click is the player's call, not this adapter's.
 */
/** Expansion lookups per task (measured: see ALIAS_BATCH_SIZE note in docs/local handoff "Vòng sửa 1"). */
export const ALIAS_BATCH_SIZE = 500
/** SVG pages scanned for ids per task. */
export const PAGE_SCAN_BATCH_SIZE = 10

type Pause = () => Promise<void>

/** Lets the browser run between batches. `scheduler.yield` (Chromium) keeps the task's place in line. */
const yieldToBrowser: Pause = () => {
  const scheduler = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler
  return scheduler?.yield ? scheduler.yield() : new Promise((resolve) => setTimeout(resolve, 0))
}

export function createScoreEngine(initial: ScoreToolkit, pause: Pause = yieldToBrowser): ScoreEngine {
  let toolkit: ScoreToolkit | null = initial
  let loaded = false
  let latest = 0

  const alive = () => {
    if (!toolkit) throw new ScoreEngineError('disposed')
    return toolkit
  }

  const renderPages = (target: ScoreToolkit) =>
    Array.from({ length: target.getPageCount() }, (_, index) => target.renderToSVG(index + 1))

  return {
    async load(input, { pageWidth }) {
      const ticket = ++latest
      // Yield once so a newer call or dispose() in the same tick cancels this one before any parsing.
      await Promise.resolve()
      const target = alive()
      if (ticket !== latest) throw new ScoreEngineError('superseded')

      loaded = false
      try {
        if (!target.setOptions(layoutOptions(pageWidth))) throw new Error('Verovio rejected the layout options')
        if (!parse(target, input)) throw new Error('Verovio rejected the score data')
        const timemap = target.renderToTimemap({ includeMeasures: true })
        const svgPages = renderPages(target)
        const mei = target.getMEI()
        // A dispose() or a newer load() while this one waits ends it: the toolkit then holds another score, or none.
        const pauseOrStop = async () => {
          await pause()
          alive()
          if (ticket !== latest) throw new ScoreEngineError('superseded')
        }
        const aliases = await expansionAliases(target, timemap, svgPages, pauseOrStop)
        loaded = true
        return { svgPages, mei, timemap, aliases }
      } catch (cause) {
        if (cause instanceof ScoreEngineError) throw cause
        throw new ScoreEngineError('load-failed', cause)
      }
    },

    relayout(pageWidth) {
      const target = alive()
      if (!loaded) throw new ScoreEngineError('not-loaded')
      try {
        if (!target.setOptions(layoutOptions(pageWidth))) throw new Error('Verovio rejected the layout options')
        target.redoLayout()
        return renderPages(target)
      } catch (cause) {
        throw new ScoreEngineError('render-failed', cause)
      }
    },

    dispose() {
      // Drop the reference first: a throwing destructor must not leave the engine half alive or destroy twice.
      const target = toolkit
      toolkit = null
      loaded = false
      try {
        target?.destroy()
      } catch {
        // Nothing the caller can do; the toolkit is unreachable either way.
      }
    },
  }
}

async function inBatches<T>(items: readonly T[], size: number, each: (item: T) => void, pause: Pause) {
  for (let index = 0; index < items.length; index += 1) {
    if (index > 0 && index % size === 0) await pause()
    each(items[index])
  }
}

const ID_ATTRIBUTE = /\sid="([^"]+)"/g

/**
 * Only an id the SVG does not draw needs its original: Verovio's `-rendN` copies of a repeat. Each is looked up by
 * id, never by cutting a suffix, and the answer is kept only when it holds up (`originalOf`).
 */
async function expansionAliases(target: ScoreToolkit, timemap: readonly RawTimemapEntry[], svgPages: readonly string[], pause: Pause) {
  const drawn = new Set<string>()
  await inBatches(svgPages, PAGE_SCAN_BATCH_SIZE, (page) => {
    for (const match of page.matchAll(ID_ATTRIBUTE)) drawn.add(match[1])
  }, pause)
  const played = new Set(timemap.flatMap((entry) => [...(entry.on ?? []), ...(entry.off ?? [])]))
  const missing = [...played].filter((id) => !drawn.has(id))

  const aliases = new Map<string, string>()
  await inBatches(missing, ALIAS_BATCH_SIZE, (id) => {
    const original = originalOf(target.getExpansionIdsForElement(id), id, drawn)
    if (original) aliases.set(id, original)
  }, pause)
  return aliases
}

/**
 * The original id of `id`, when Verovio's answer is an array of strings that names `id` and starts with an id the SVG
 * draws. Keys are never drawn and values always are, so no two aliases can point at each other.
 */
function originalOf(answer: unknown, id: string, drawn: ReadonlySet<string>): string | undefined {
  if (!Array.isArray(answer) || !answer.every((value) => typeof value === 'string') || !answer.includes(id)) return undefined
  const original = answer[0] as string
  return original !== id && drawn.has(original) ? original : undefined
}

function parse(target: ScoreToolkit, input: ScoreInput): boolean {
  if (input.format === 'mxl') return target.loadZipDataBuffer(input.data.slice().buffer)
  return target.loadData(typeof input.data === 'string' ? input.data : new TextDecoder().decode(input.data))
}

/**
 * `adjustPageHeight` (Chat 2026-11-08, P4 fix 1): a page is only as tall as its systems, so a short song does not sit
 * on a whole A4 of blank paper. Layout only; the timemap does not change.
 */
const layoutOptions = (pageWidth: number) => ({ pageWidth, adjustPageHeight: true })
