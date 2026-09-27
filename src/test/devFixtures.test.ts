import { describe, expect, it } from 'vitest'

/**
 * Decision 0002 guard: dev fixtures must never be reachable from production code paths.
 * `*.dev.ts` modules may only be loaded by a dynamic import behind `import.meta.env.DEV`.
 */
const sources = import.meta.glob<string>(['/src/**/*.{ts,tsx}', '!/src/**/*.test.{ts,tsx}'], {
  query: '?raw',
  import: 'default',
  eager: true,
})
const files = Object.entries(sources)
const isDevModule = (path: string) => /\.dev\.tsx?$/.test(path)

const staticDevImport = /^\s*(?:import|export)\b[^;]*?\bfrom\s+['"][^'"]*\.dev['"]|^\s*import\s+['"][^'"]*\.dev['"]/m
const dynamicFixtureImport = /import\(\s*['"][^'"]*fixtures\.dev['"]\s*\)/g
const fixtureGuard = /import\.meta\.env\.DEV && env\.useDevFixtures/g

describe('dev fixtures (decision 0002)', () => {
  it('are never imported statically outside other dev modules', () => {
    const offenders = files.filter(([path, code]) => !isDevModule(path) && staticDevImport.test(code))
    expect(offenders.map(([path]) => path)).toEqual([])
  })

  it('are only loaded behind the import.meta.env.DEV guard', () => {
    const unguarded = files.filter(([, code]) => {
      const imports = code.match(dynamicFixtureImport)?.length ?? 0
      const guards = code.match(fixtureGuard)?.length ?? 0
      return imports > guards
    })
    expect(unguarded.map(([path]) => path)).toEqual([])
  })

  it('are labelled as dev fixtures, not API contracts', () => {
    const devModules = files.filter(([path]) => isDevModule(path))
    expect(devModules.length).toBeGreaterThan(0)
    for (const [path, code] of devModules) {
      expect(code, path).toContain('DEV FIXTURE – không phải API contract')
    }
  })
})
