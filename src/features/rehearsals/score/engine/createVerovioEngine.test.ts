import { describe, expect, it, vi } from 'vitest'

const moduleFactory = vi.hoisted(() => vi.fn(async () => ({ fake: 'module' })))
const toolkitConstructor = vi.hoisted(() => vi.fn())
/** Mock factories run when the module is first imported, so this counts real imports of Verovio. */
const imported = vi.hoisted(() => ({ wasm: 0, esm: 0 }))

vi.mock('verovio/wasm', () => {
  imported.wasm++
  return { default: moduleFactory }
})
vi.mock('verovio/esm', () => {
  imported.esm++
  return {
    VerovioToolkit: class {
      constructor(module: unknown) {
        toolkitConstructor(module)
      }
      destroy() {}
    },
  }
})

describe('createVerovioEngine', () => {
  it('importing the engine module does not start Verovio; creating an engine does, once', async () => {
    const { createVerovioEngine } = await import('./index')

    expect(imported).toEqual({ wasm: 0, esm: 0 })
    expect(moduleFactory).not.toHaveBeenCalled()
    expect(toolkitConstructor).not.toHaveBeenCalled()

    const engine = await createVerovioEngine()

    expect(imported).toEqual({ wasm: 1, esm: 1 })
    expect(moduleFactory).toHaveBeenCalledTimes(1)
    expect(toolkitConstructor).toHaveBeenCalledWith({ fake: 'module' })
    engine.dispose()
  })

  it('a failing WASM start rejects with init-failed', async () => {
    const { createVerovioEngine, ScoreEngineError } = await import('./index')
    moduleFactory.mockRejectedValueOnce(new Error('CompileError: wasm'))

    const error = await createVerovioEngine().catch((reason: unknown) => reason)

    expect(error).toBeInstanceOf(ScoreEngineError)
    expect(error).toMatchObject({ code: 'init-failed' })
  })
})
