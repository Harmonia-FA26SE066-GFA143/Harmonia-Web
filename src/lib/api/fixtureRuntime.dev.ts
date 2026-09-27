/**
 * DEV FIXTURE – không phải API contract.
 * Shared runtime for feature `api/fixtures.dev.ts` files (decision 0002, option B, approved by Daniel 2026-09-27).
 * Only fixture files import this module, and they are loaded solely through a dynamic import guarded by
 * `import.meta.env.DEV`, so it never reaches the production bundle.
 *
 * `?state=` query parameter (dev only) to review page states:
 * - `loading`: reads never resolve.
 * - `empty`: reads return no items.
 * - `error`: reads fail.
 * - `save-error`: reads succeed, writes fail.
 * "No filter results" is reached by searching/filtering on the page itself.
 */

type FixtureState = 'loading' | 'empty' | 'error' | 'save-error'

const latencyMs = 400

function fixtureState(): FixtureState | undefined {
  const state = new URLSearchParams(window.location.search).get('state')
  return state === 'loading' || state === 'empty' || state === 'error' || state === 'save-error' ? state : undefined
}

const delay = () => new Promise((resolve) => setTimeout(resolve, latencyMs))

/** Simulated list read. Returns copies so callers cannot mutate the fixture store. */
export async function readFixture<T extends object>(items: T[]): Promise<T[]> {
  const state = fixtureState()
  if (state === 'loading') return new Promise<never>(() => {})
  await delay()
  if (state === 'error') throw new Error('DEV FIXTURE: lỗi tải dữ liệu mô phỏng')
  if (state === 'empty') return []
  return items.map((item) => ({ ...item }))
}

/** Simulated write. `apply` changes the in-memory store and returns the saved item. */
export async function writeFixture<T extends object>(apply: () => T): Promise<T> {
  await delay()
  if (fixtureState() === 'save-error') throw new Error('DEV FIXTURE: lỗi lưu mô phỏng')
  return { ...apply() }
}

let sequence = 0

/** Identifier for items created in the browser session; resets on reload. */
export function nextFixtureId(prefix: string): string {
  sequence += 1
  return `dev-${prefix}-${sequence}`
}
