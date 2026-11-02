import type { ComponentType } from 'react'
import type { RouteObject } from 'react-router'

/** Metadata attached to each page route (read with useMatches). */
export interface PageHandle {
  title: string
  breadcrumb?: string[]
}

export function isPageHandle(value: unknown): value is PageHandle {
  return typeof value === 'object' && value !== null && 'title' in value
}

/** Route for an implemented page, code-split with a lazy import. */
export function pageRoute(path: string, handle: PageHandle, load: () => Promise<ComponentType>): RouteObject {
  return {
    path,
    handle,
    lazy: async () => ({ Component: await load() }),
  }
}
