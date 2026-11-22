import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { configDefaults } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Dev only: forward API calls to the backend so the browser stays same-origin (the backend's CORS list
  // does not include the dev server). Leave VITE_API_BASE_URL empty when using the proxy.
  const apiProxyTarget = loadEnv(mode, process.cwd(), '').API_PROXY_TARGET

  return {
    plugins: [react()],
    // `/hubs` is the SignalR endpoint (chat), which needs the WebSocket upgrade forwarded.
    server: apiProxyTarget
      ? {
          proxy: {
            '/api': { target: apiProxyTarget, changeOrigin: true },
            '/hubs': { target: apiProxyTarget, changeOrigin: true, ws: true },
          },
        }
      : undefined,
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      // Session worktrees under .claude/ carry their own node_modules; their copies of the tests would load a second React.
      exclude: [...configDefaults.exclude, 'tests/e2e/**', '.claude/**'],
      css: false,
      // The default (all logical CPUs - 1) starves each jsdom + Ant Design worker on hyper-threaded laptops: a 1 s
      // test took 4 s+ and crossed the 5 s timeout at random. Half the logical CPUs keeps the slowest test near 2 s.
      maxWorkers: '50%',
      // Under a loaded Windows machine the heaviest page tests (3.7 s alone) still crossed the default 5 s in full runs,
      // a different test each time (M4 icon set, 2026-11-21). The limit only stops a hung test; assertions are unchanged.
      testTimeout: 15000,
      // A local .env may point at a real backend; tests must never reach it.
      env: { VITE_API_BASE_URL: '' },
    },
  }
})
