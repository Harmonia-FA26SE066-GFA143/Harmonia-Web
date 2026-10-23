/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Dev only: forward API calls to the backend so the browser stays same-origin (the backend's CORS list
  // does not include the dev server). Leave VITE_API_BASE_URL empty when using the proxy.
  const apiProxyTarget = loadEnv(mode, process.cwd(), '').API_PROXY_TARGET

  return {
    plugins: [react()],
    server: apiProxyTarget ? { proxy: { '/api': { target: apiProxyTarget, changeOrigin: true } } } : undefined,
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: false,
      // The default (all logical CPUs - 1) starves each jsdom + Ant Design worker on hyper-threaded laptops: a 1 s
      // test took 4 s+ and crossed the 5 s timeout at random. Half the logical CPUs keeps the slowest test near 2 s.
      maxWorkers: '50%',
      // A local .env may point at a real backend; tests must never reach it.
      env: { VITE_API_BASE_URL: '' },
    },
  }
})
