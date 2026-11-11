import { describe, expect, it } from 'vitest'

/**
 * Locks the import graph that keeps the sample score and WAV out of `dist/`: any `.wav`/`.mxl` import in the app lives in
 * the dev source, is dynamic, and comes after its guard. The build itself cannot run in a unit test; the gate greps `dist/`.
 */
const sources = import.meta.glob<string>(['/src/**/*.{ts,tsx}', '!/src/**/*.test.{ts,tsx}'], { query: '?raw', import: 'default', eager: true })
const publicSamples = import.meta.glob('/public/**/*.{wav,mxl}')

const DEV_SOURCE = '/src/features/rehearsals/score/source/DevFixtureScoreSource.ts'
const GUARD = 'if (!(import.meta.env.DEV && env.useDevFixtures)) throw'
const assetImport = /(?:\bfrom\s+|\bimport\s*\(?\s*)['"][^'"]+\.(?:wav|mxl)(?:\?[^'"]*)?['"]/g
const staticAssetImport = /^\s*(?:import|export)\b(?!\s*\()[^;\n]*['"][^'"]+\.(?:wav|mxl)(?:\?[^'"]*)?['"]/m
const dynamicAssetImport = /\bimport\(\s*['"][^'"]+\.(?:wav|mxl)(?:\?[^'"]*)?['"]\s*\)/g

describe('dev score assets stay out of production', () => {
  it('are imported only by the dev source', () => {
    const importers = Object.entries(sources).filter(([, code]) => code.match(assetImport))
    expect(importers.map(([path]) => path)).toEqual([DEV_SOURCE])
  })

  it('are imported dynamically, never statically', () => {
    expect(staticAssetImport.test(sources[DEV_SOURCE])).toBe(false)
    expect(sources[DEV_SOURCE].match(dynamicAssetImport)).toHaveLength(2)
  })

  it('are imported only after the guard', () => {
    const code = sources[DEV_SOURCE]
    const guardAt = code.indexOf(GUARD)
    expect(guardAt).toBeGreaterThanOrEqual(0)
    for (const match of code.matchAll(dynamicAssetImport)) expect(match.index).toBeGreaterThan(guardAt)
  })

  it('are not copied through public/', () => {
    expect(Object.keys(publicSamples)).toEqual([])
  })
})
