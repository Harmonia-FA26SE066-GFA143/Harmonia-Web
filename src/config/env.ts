export const env = {
  /** Backend API base URL. Empty until the backend contract and environment are supplied. */
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, ''),
  /**
   * Dev-only fixtures (docs/decisions/0002-data-before-api.md). Always false in production builds.
   * Call sites must still guard the fixture import with `import.meta.env.DEV` so it is dropped from dist/.
   */
  useDevFixtures: import.meta.env.DEV && import.meta.env.VITE_USE_DEV_FIXTURES === 'true',
} as const
