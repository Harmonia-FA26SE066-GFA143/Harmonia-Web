import { createScoreEngine } from './createScoreEngine'
import { ScoreEngineError, type ScoreEngine } from './types'

/** Loads Verovio (JS + embedded WASM) on first call only, as its own chunk. Each engine gets its own WASM module. */
export async function createVerovioEngine(): Promise<ScoreEngine> {
  try {
    const [{ default: createVerovioModule }, { VerovioToolkit }] = await Promise.all([import('verovio/wasm'), import('verovio/esm')])
    return createScoreEngine(new VerovioToolkit(await createVerovioModule()))
  } catch (cause) {
    throw new ScoreEngineError('init-failed', cause)
  }
}
