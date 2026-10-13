export const env = {
  /** Backend API base URL. Empty until the backend contract and environment are supplied. */
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, ''),
  /**
   * OAuth client id (type Web) for Google sign-in; empty hides the Google button. The backend must list it in
   * `Google__ClientIds`.
   */
  googleClientId: (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '').trim(),
  /**
   * Dev-only fixtures (decision 0002, data before API). Always false in production builds.
   * Call sites must still guard the fixture import with `import.meta.env.DEV` so it is dropped from dist/.
   */
  useDevFixtures: import.meta.env.DEV && import.meta.env.VITE_USE_DEV_FIXTURES === 'true',
} as const
