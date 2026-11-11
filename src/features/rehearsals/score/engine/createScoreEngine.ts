import type { RawTimemapEntry } from '../timeline/types'
import { ScoreEngineError, type ScoreEngine, type ScoreToolkit } from './types'

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

/**
 * Most `<note>` elements a score may have before the engine refuses it with `too-complex`: a limit on elements, not on
 * sounding notes. Each note of a chord counts; in MusicXML a rest is a `<note>` too and counts (in Verovio's MEI it is a
 * `<rest>` and does not), so the user is told "nốt và dấu lặng". Comments and CDATA are skipped. Verovio parses, lays out and builds the timemap in single calls that cannot yield and grow
 * faster than the score (P10-A, Chromium, 4-part score in eighths with 2 verses and a repeat every 8 bars): 200 bars,
 * 6 400 notes, load 3,3 s; 400 bars 6,6 s; 800 bars 24,4 s. 6 400 keeps the longest load under the 4,6 s accepted in
 * slice 1 (F2-I1); a real 4-part hymn of 100 bars in quarters has about 1 600. To change it, measure again (report P10-A).
 */
export const MAX_SCORE_NOTES = 6400
const HIDDEN = [
  ['<!--', '-->'],
  ['<![CDATA[', ']]>'],
] as const

/**
 * `<note` followed by a space, `/` or `>`, outside comments and CDATA. One pass from `<` to `<` with no DOM: a comment or
 * CDATA that never closes hides the rest of the text, as an XML parser would read it.
 */
function countNotes(xml: string): number {
  let count = 0
  let at = xml.indexOf('<')
  while (at !== -1) {
    const hidden = HIDDEN.find(([open]) => xml.startsWith(open, at))
    if (hidden) {
      const end = xml.indexOf(hidden[1], at + hidden[0].length)
      if (end === -1) break
      at = xml.indexOf('<', end + hidden[1].length)
      continue
    }
    if (xml.startsWith('<note', at) && /[\s/>]/.test(xml.charAt(at + 5))) count += 1
    at = xml.indexOf('<', at + 1)
  }
  return count
}

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
      // MusicXML text is counted before Verovio sees it. An mxl is only counted once parsed (from its MEI), before the
      // timemap and the pages, the larger part of the time.
      // ponytail: an over-limit mxl still costs its parse (800 bars: 5,7 s); unzip it here first if that matters.
      const text = input.format === 'musicxml' ? asText(input.data) : undefined
      if (text !== undefined && countNotes(text) > MAX_SCORE_NOTES) throw new ScoreEngineError('too-complex')
      try {
        if (!target.setOptions(layoutOptions(pageWidth))) throw new Error('Verovio rejected the layout options')
        const parsed = input.format === 'mxl' ? target.loadZipDataBuffer(input.data.slice().buffer) : target.loadData(text ?? '')
        if (!parsed) throw new Error('Verovio rejected the score data')
        const mei = target.getMEI()
        if (countNotes(mei) > MAX_SCORE_NOTES) throw new ScoreEngineError('too-complex')
        const timemap = target.renderToTimemap({ includeMeasures: true })
        const svgPages = renderPages(target)
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

const asText = (data: string | Uint8Array) => (typeof data === 'string' ? data : new TextDecoder().decode(data))

/**
 * `adjustPageHeight` (Chat 2026-11-08, P4 fix 1): a page is only as tall as its systems, so a short song does not sit
 * on a whole A4 of blank paper. Layout only; the timemap does not change.
 */
const layoutOptions = (pageWidth: number) => ({ pageWidth, adjustPageHeight: true })
