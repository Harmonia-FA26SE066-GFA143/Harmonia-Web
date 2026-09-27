/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_USE_DEV_FIXTURES?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
