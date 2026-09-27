import type { ComponentType } from 'react'
import type { RouteObject } from 'react-router'

/** Metadata attached to each page route (read with useMatches). */
export interface PageHandle {
  title: string
  breadcrumb?: string[]
  /** Phase of docs/local/design/stitch-implementation-plan.md that builds the page; 'TBD' when unassigned. */
  phase: number | 'TBD'
  /** True while the route still renders PlaceholderPage. */
  placeholder?: boolean
}

export function isPageHandle(value: unknown): value is PageHandle {
  return typeof value === 'object' && value !== null && 'title' in value && 'phase' in value
}

/** Route for an implemented page, code-split with a lazy import. */
export function pageRoute(path: string, handle: PageHandle, load: () => Promise<ComponentType>): RouteObject {
  return {
    path,
    handle,
    lazy: async () => ({ Component: await load() }),
  }
}

/**
 * Temporary route for a page listed in the screen map but not built yet.
 * Each phase replaces its placeholders with pageRoute and a lazy import of the feature page.
 */
export function placeholderRoute(path: string, handle: PageHandle): RouteObject {
  return pageRoute(path, { ...handle, placeholder: true }, async () => {
    const { PlaceholderPage } = await import('@/app/pages/PlaceholderPage')
    return PlaceholderPage
  })
}
