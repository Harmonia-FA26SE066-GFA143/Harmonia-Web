import { ScoreEngineError, type ScoreEngine, type ScoreInput, type ScoreToolkit } from './types'

/**
 * Wraps a toolkit with a lifecycle. Verovio options stay as in the spike (docs/local/spikes/verovio): defaults plus
 * `pageWidth`, timemap with `includeMeasures`, `getMEI()` without options. Repeats are left to Verovio's default
 * expansion; how the player treats repeats (AliasMap, which pass to show) is Track A's call, not this adapter's.
 */
export function createScoreEngine(initial: ScoreToolkit): ScoreEngine {
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
        if (!target.setOptions({ pageWidth })) throw new Error('Verovio rejected the layout options')
        if (!parse(target, input)) throw new Error('Verovio rejected the score data')
        const result = { svgPages: renderPages(target), mei: target.getMEI(), timemap: target.renderToTimemap({ includeMeasures: true }) }
        loaded = true
        return result
      } catch (cause) {
        throw new ScoreEngineError('load-failed', cause)
      }
    },

    relayout(pageWidth) {
      const target = alive()
      if (!loaded) throw new ScoreEngineError('not-loaded')
      try {
        if (!target.setOptions({ pageWidth })) throw new Error('Verovio rejected the layout options')
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

function parse(target: ScoreToolkit, input: ScoreInput): boolean {
  if (input.format === 'mxl') return target.loadZipDataBuffer(input.data.slice().buffer)
  return target.loadData(typeof input.data === 'string' ? input.data : new TextDecoder().decode(input.data))
}
